import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { ABOUT } from "@/lib/portfolio-data";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 200;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

const WINDOW_MS = 10 * 60_000;
const LIMIT = 3;
const MAX_IP_ENTRIES = 5_000;
const hits = new Map<string, number[]>();

type FieldErrors = Partial<
  Record<"name" | "email" | "subject" | "message", string>
>;

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  for (const [key, stamps] of hits) {
    const fresh = stamps.filter((t) => t > cutoff);
    if (fresh.length === 0) hits.delete(key);
    else if (fresh.length !== stamps.length) hits.set(key, fresh);
  }

  const recent = hits.get(ip) ?? [];
  if (recent.length >= LIMIT) return true;

  if (!hits.has(ip)) {
    while (hits.size >= MAX_IP_ENTRIES) {
      const oldest = hits.keys().next().value;
      if (oldest === undefined) break;
      hits.delete(oldest);
    }
  }

  recent.push(now);
  hits.set(ip, recent);
  return false;
}

type Validated = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function validate(
  body: unknown,
): { fields: Validated } | { errors: FieldErrors } {
  const obj =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const name = readString(obj.name);
  const email = readString(obj.email);
  const subject = readString(obj.subject);
  const message = readString(obj.message);

  const errors: FieldErrors = {};
  if (name.length < 1 || name.length > MAX_NAME)
    errors.name = "Required (max 100)";
  if (email.length < 1 || email.length > MAX_EMAIL || !EMAIL_RE.test(email))
    errors.email = "Enter a valid email";
  if (subject.length > MAX_SUBJECT) errors.subject = "Too long (max 200)";
  if (message.length < 1 || message.length > MAX_MESSAGE)
    errors.message = "Required (max 5000)";

  if (Object.keys(errors).length) return { errors };
  return { fields: { name, email, subject, message } };
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY is not set");
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        error: "validation",
        fields: { message: "Invalid request" },
      },
      { status: 400 },
    );
  }

  const result = validate(body);
  if ("errors" in result) {
    return Response.json(
      { ok: false, error: "validation", fields: result.errors },
      { status: 400 },
    );
  }
  const { name, email, subject, message } = result.fields;

  const ip = getIp(request);
  if (rateLimited(ip)) {
    return Response.json({ ok: false, error: "rate_limit" }, { status: 429 });
  }

  const finalSubject = `[Portfolio] ${subject || `Hello from ${name}`}`;
  const text = `${message}\n\n— ${name} <${email}>`;
  const html = `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p><p style="color:#888">— ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>`;

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send(
      {
        from: "Portfolio Contact <contact@mail.thepixelme.com>",
        to: [ABOUT.email],
        replyTo: email,
        subject: finalSubject,
        text,
        html,
      },
      {
        idempotencyKey: `contact/${Date.now()}/${crypto.randomUUID()}`,
      },
    );

    if (error) {
      console.error("[contact] Resend error:", error);
      return Response.json({ ok: false, error: "server" }, { status: 500 });
    }

    return Response.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("[contact] Resend threw:", err);
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}
