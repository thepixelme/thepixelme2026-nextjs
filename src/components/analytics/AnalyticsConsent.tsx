"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";
import { type ConsentValue, readConsent, writeConsent } from "@/lib/analytics";

const buttonBase =
  "inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium select-none transition-colors duration-100 active:scale-[0.97] motion-reduce:transition-none lg:h-9";

export default function AnalyticsConsent() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!gaId) return;
    const stored = readConsent();
    setConsent(stored);
    setBannerVisible(stored === null);
  }, [gaId]);

  if (!mounted || !gaId) return null;

  const handleAccept = () => {
    const ok = writeConsent("granted");
    setBannerVisible(false);
    if (ok) setConsent("granted");
  };

  const handleDecline = () => {
    writeConsent("denied");
    setBannerVisible(false);
    setConsent("denied");
  };

  return (
    <>
      {consent === "granted" && <GoogleAnalytics gaId={gaId} />}
      {bannerVisible && (
        <section
          aria-label="Analytics consent"
          className="fixed z-50 inset-x-3 top-[calc(env(safe-area-inset-top)+3.25rem)] mx-auto max-w-md overflow-hidden rounded-xl border border-separator bg-overlay shadow-overlay backdrop-blur-(--glass-blur) lg:inset-auto lg:right-4 lg:top-12 lg:mx-0 lg:max-w-sm"
        >
          <div className="px-4 py-3">
            <p className="text-sm">
              This site uses Google Analytics to understand which apps and links
              visitors engage with. No personal data is sold or shared.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDecline}
                className={`${buttonBase} bg-default hover:bg-default-hover`}
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className={`${buttonBase} bg-default text-accent-soft-foreground hover:bg-default-hover`}
              >
                Accept
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
