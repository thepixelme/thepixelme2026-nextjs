import AnalyticsConsent from "@/components/analytics/AnalyticsConsent";
import { readConsentServer } from "@/lib/analytics-server";

/**
 * Async Server Component that reads the consent cookie at request time and
 * passes the value into the client `AnalyticsConsent`. Wrap in
 * `<Suspense fallback={null}>` so the dynamic access (cookies()) doesn't
 * force the entire layout into dynamic rendering.
 */
export default async function AnalyticsConsentServer() {
  const initialConsent = await readConsentServer();
  return <AnalyticsConsent initialConsent={initialConsent} />;
}
