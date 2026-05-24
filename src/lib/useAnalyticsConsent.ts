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

export function useAnalyticsConsent(): UseAnalyticsConsent {
  const enabled = Boolean(GA_ID);
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
    mounted,
    consent,
    promptVisible,
    enabled,
    analyticsEnabled,
    accept,
    decline,
  };
}
