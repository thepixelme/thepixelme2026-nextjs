"use client";

import { useCallback, useEffect, useState } from "react";
import { type ConsentValue, writeConsent } from "@/lib/analytics";

export interface UseAnalyticsConsent {
  /** Persisted consent value, seeded from the server cookie read. */
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

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google's documented per-property opt-out flag. Honored immediately by
 * already-loaded gtag.js for all subsequent calls (page_view on navigation,
 * config, etc.) — independent of whether the React `<GoogleAnalytics>`
 * component is mounted.
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/user-opt-out
 *
 * Module-private so handlers and the effect backstop both write through the
 * same place. Both writers are idempotent.
 */
function setGaDisabled(disabled: boolean) {
  if (!GA_ID || typeof window === "undefined") return;
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] =
    disabled;
}

export function useAnalyticsConsent(
  initialConsent: ConsentValue | null,
): UseAnalyticsConsent {
  const enabled = Boolean(GA_ID);
  const [consent, setConsent] = useState<ConsentValue | null>(initialConsent);
  const [promptVisible, setPromptVisible] = useState(
    enabled && initialConsent === null,
  );

  const accept = useCallback(() => {
    const ok = writeConsent("granted");
    setPromptVisible(false);
    if (ok) {
      // Synchronous: must run BEFORE setConsent triggers the re-render that
      // mounts <GoogleAnalytics>. Otherwise next/script injects gtag.js and
      // the first `gtag('config', gaId)` could see ga-disable === true and
      // drop the page_view. The post-render effect below is a backstop.
      setGaDisabled(false);
      setConsent("granted");
    }
  }, []);

  const decline = useCallback(() => {
    // Synchronous: stop already-loaded gtag.js immediately, before React
    // unmounts <GoogleAnalytics>.
    setGaDisabled(true);
    writeConsent("denied");
    setPromptVisible(false);
    setConsent("denied");
  }, []);

  const analyticsEnabled = enabled && consent === "granted";

  // Backstop for mount/hydration/cross-tab cases that don't go through
  // accept()/decline(). Idempotent with the synchronous writes above.
  useEffect(() => {
    setGaDisabled(!analyticsEnabled);
  }, [analyticsEnabled]);

  return {
    consent,
    promptVisible,
    enabled,
    analyticsEnabled,
    accept,
    decline,
  };
}
