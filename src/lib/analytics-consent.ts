/**
 * Server-safe consent contract. No "use client", no server-only imports, no
 * third-party imports — so both `analytics.ts` (which pulls the client-only
 * @next/third-parties/google) and `analytics-server.ts` (which calls
 * next/headers cookies()) can import from here without cross-contamination.
 */

export const GA_CONSENT_COOKIE = "ga-consent";

export type ConsentValue = "granted" | "denied";

export function parseConsent(
  value: string | null | undefined,
): ConsentValue | null {
  return value === "granted" || value === "denied" ? value : null;
}
