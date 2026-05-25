import { cookies } from "next/headers";
import {
  type ConsentValue,
  GA_CONSENT_COOKIE,
  parseConsent,
} from "@/lib/analytics-consent";

/**
 * Read the analytics consent cookie at request time. Server-only — imports
 * `next/headers`. Must not be reached from client code.
 *
 * Imports only from `next/headers` and `analytics-consent` so the server graph
 * never pulls `@next/third-parties/google` (which is marked "use client").
 */
export async function readConsentServer(): Promise<ConsentValue | null> {
  return parseConsent((await cookies()).get(GA_CONSENT_COOKIE)?.value);
}
