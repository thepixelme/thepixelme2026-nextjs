import { sendGAEvent } from "@next/third-parties/google";
import type { AppId } from "@/types/window";

export const GA_CONSENT_STORAGE_KEY = "ga-consent";

export type ConsentValue = "granted" | "denied";

export function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(GA_CONSENT_STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/** Returns true if the value was persisted, false on storage failure. */
export function writeConsent(value: ConsentValue): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(GA_CONSENT_STORAGE_KEY, value);
    return true;
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
