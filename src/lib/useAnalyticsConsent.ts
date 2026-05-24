"use client";

import { useCallback, useEffect, useState } from "react";
import { type ConsentValue, readConsent, writeConsent } from "@/lib/analytics";

export interface UseAnalyticsConsent {
  /** False during first render to keep hydration safe. */
  mounted: boolean;
  /** Persisted value from `localStorage` (post-hydration). */
  consent: ConsentValue | null;
  /** Session-only display state — true when the consent card should render. */
  promptVisible: boolean;
  /** True when `NEXT_PUBLIC_GA_ID` is set. */
  enabled: boolean;
  /** True when consent is granted AND env var is set — drives `<GoogleAnalytics>` mount. */
  analyticsEnabled: boolean;
  accept: () => void;
  decline: () => void;
}

export function useAnalyticsConsent(): UseAnalyticsConsent {
  const enabled = Boolean(process.env.NEXT_PUBLIC_GA_ID);
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const [promptVisible, setPromptVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!enabled) return;
    const stored = readConsent();
    setConsent(stored);
    setPromptVisible(stored === null);
  }, [enabled]);

  const accept = useCallback(() => {
    const ok = writeConsent("granted");
    setPromptVisible(false);
    if (ok) setConsent("granted");
  }, []);

  const decline = useCallback(() => {
    writeConsent("denied");
    setPromptVisible(false);
    setConsent("denied");
  }, []);

  return {
    mounted,
    consent,
    promptVisible,
    enabled,
    analyticsEnabled: enabled && consent === "granted",
    accept,
    decline,
  };
}
