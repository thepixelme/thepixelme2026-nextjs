"use client";

import { Check, Loader2, Send } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { ABOUT } from "@/lib/portfolio-data";

const fieldInputClass =
  "min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:font-light placeholder:text-foreground/30";

type Status = "idle" | "sending" | "sent" | "error";

type ContactResponse =
  | { ok: true; id?: string }
  | { ok: false; error: "validation"; fields?: Record<string, string> }
  | { ok: false; error: "rate_limit" | "server" };

function isContactResponse(value: unknown): value is ContactResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { ok?: unknown; error?: unknown };
  if (candidate.ok === true) return true;
  return (
    candidate.ok === false &&
    (candidate.error === "validation" ||
      candidate.error === "rate_limit" ||
      candidate.error === "server")
  );
}

export default function ContactApp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (sentTimerRef.current) clearTimeout(sentTimerRef.current);
    };
  }, []);

  const canSend =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    message.trim().length > 0 &&
    status !== "sending";

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSend) return;

    setStatus("sending");
    setErrorMsg(null);

    let resOk = false;
    let payload: unknown = null;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message,
        }),
      });
      resOk = res.ok;
      try {
        payload = await res.json();
      } catch {
        // non-JSON body
      }
    } catch {
      // network failure
    }

    if (resOk && isContactResponse(payload) && payload.ok === true) {
      trackEvent({
        name: "contact_form_submit",
        subject_length: subject.trim().length,
      });
      setStatus("sent");
      setSubject("");
      setMessage("");
      if (sentTimerRef.current) clearTimeout(sentTimerRef.current);
      sentTimerRef.current = setTimeout(() => setStatus("idle"), 4000);
      return;
    }

    if (
      isContactResponse(payload) &&
      payload.ok === false &&
      payload.error === "rate_limit"
    ) {
      setErrorMsg("Too many messages — try again in a few minutes.");
      setStatus("error");
      return;
    }

    if (
      isContactResponse(payload) &&
      payload.ok === false &&
      payload.error === "validation"
    ) {
      setErrorMsg("Please check the form fields.");
      setStatus("error");
      return;
    }

    setErrorMsg("Couldn't send. Please try again.");
    setStatus("error");
  };

  const initials = ABOUT.name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("");

  const sending = status === "sending";

  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          if (canSend) e.currentTarget.requestSubmit();
        }
      }}
      className="flex h-full flex-col"
    >
      <FieldRow label="To">
        <span className="inline-flex items-center gap-2.5 rounded-full bg-surface-secondary py-1 pl-1 pr-3.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-linear-to-br from-accent to-accent/70 text-[11px] font-semibold tracking-wide text-white shadow-sm">
            {initials}
          </span>
          <span className="text-[15px]">{ABOUT.name}</span>
        </span>
      </FieldRow>

      <FieldRow label="From">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          readOnly={sending}
          autoComplete="name"
          className={fieldInputClass}
          aria-label="Your name"
        />
        <span
          className="hidden text-foreground/20 sm:inline"
          aria-hidden="true"
        >
          /
        </span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@email.com"
          required
          readOnly={sending}
          autoComplete="email"
          className={`${fieldInputClass} w-full sm:w-60 sm:flex-none`}
          aria-label="Your email"
        />
      </FieldRow>

      <div className="border-b border-separator px-7 pb-5 pt-4">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          readOnly={sending}
          className="w-full bg-transparent text-[18px] font-medium tracking-tight outline-none placeholder:font-light placeholder:text-foreground/25"
          aria-label="Subject"
        />
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message…"
        required
        readOnly={sending}
        aria-label="Message body"
        className="min-h-0 flex-1 resize-none bg-transparent px-7 py-5 text-[15px] leading-[1.7] outline-none placeholder:font-light placeholder:text-foreground/30"
      />

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-separator px-5 py-3">
        <output aria-live="polite" className="mr-auto text-[12px] empty:hidden">
          {status === "sent" && (
            <span className="text-foreground/70">Message sent — thanks!</span>
          )}
          {status === "error" && errorMsg && (
            <span className="text-red-500">{errorMsg}</span>
          )}
        </output>
        <kbd className="hidden items-center gap-1 rounded-md border border-separator px-1.5 py-0.5 font-mono text-[11px] text-foreground/50 sm:inline-flex">
          <span>⌘</span>
          <span>↵</span>
        </kbd>
        <button
          type="submit"
          disabled={!canSend || status === "sent"}
          aria-label="Send message"
          className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-5 text-[13px] font-medium text-white shadow-sm transition-all duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
        >
          {status === "sending" ? (
            <>
              <Loader2 size={14} strokeWidth={2.25} className="animate-spin" />
              Sending…
            </>
          ) : status === "sent" ? (
            <>
              <Check size={14} strokeWidth={2.25} />
              Sent
            </>
          ) : (
            <>
              <Send size={14} strokeWidth={2.25} />
              Send
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-5 border-b border-separator px-7 py-3.5">
      <span className="w-10 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/40">
        {label}
      </span>
      <div className="flex flex-1 items-center gap-3">{children}</div>
    </div>
  );
}
