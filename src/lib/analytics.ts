import { sendGAEvent } from "@next/third-parties/google";
import {
  type ConsentValue,
  GA_CONSENT_COOKIE,
  parseConsent,
} from "@/lib/analytics-consent";
import type { AppId } from "@/types/window";

export { GA_CONSENT_COOKIE, parseConsent };
export type { ConsentValue };

// 1 year, renewed on each accept/decline.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${GA_CONSENT_COOKIE}=([^;]+)`),
  );
  return parseConsent(match?.[1]);
}

/** Returns true if the value was persisted (verified by read-back), false otherwise. */
export function writeConsent(value: ConsentValue): boolean {
  if (typeof document === "undefined") return false;
  try {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is not supported in Safari; direct assignment is intentional. Read-back below verifies persistence regardless of the rejection path.
    document.cookie = `${GA_CONSENT_COOKIE}=${value}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    // document.cookie assignment doesn't throw when the browser rejects the
    // cookie (third-party blocking, quota, malformed value). Read back to
    // verify — preserves fail-closed posture on Accept-with-storage-failure.
    return readConsent() === value;
  } catch {
    return false;
  }
}

type GAEvent =
  | { name: "contact_form_submit"; subject_length: number }
  | { name: "app_open"; app_id: AppId }
  | { name: "spotlight_select"; app_id: AppId; query_length: number }
  | {
      name: "outbound_click";
      href: string;
      surface: "about_social" | "project_link" | "project_source";
    };

export function trackEvent(event: GAEvent) {
  if (typeof window === "undefined") return;
  if (readConsent() !== "granted") return;
  if (!process.env.NEXT_PUBLIC_GA_ID) return;
  const { name, ...params } = event;
  sendGAEvent("event", name, params);
}
