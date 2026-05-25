"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { BarChart3 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import MobileConsentNotification from "@/components/notifications/MobileConsentNotification";
import NotificationCard from "@/components/notifications/NotificationCard";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import type { ConsentValue } from "@/lib/analytics-consent";
import { useNotificationCenter } from "@/lib/notification-center";
import { useAnalyticsConsent } from "@/lib/useAnalyticsConsent";
import { useIsMobile } from "@/lib/useIsMobile";

interface Props {
  /** Seeded by `AnalyticsConsentServer` from the request cookie. */
  initialConsent: ConsentValue | null;
}

export default function AnalyticsConsent({ initialConsent }: Props) {
  const consent = useAnalyticsConsent(initialConsent);
  const isMobile = useIsMobile();
  const { open, setOpen, setPersistent } = useNotificationCenter();
  const declineRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const closeAfterChoiceRef = useRef(false);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // (1) Mark the NC persistent while undecided — close attempts are refused
  //     so the consent card stays visible, but the rest of the page remains
  //     interactive (the backdrop is suppressed in persistent mode).
  //     Declared FIRST so its effect runs first in declaration order — the
  //     deferred-close effect below depends on persistentRef.current being
  //     false by the time it runs.
  useEffect(() => {
    setPersistent(consent.enabled && consent.consent === null);
  }, [consent.enabled, consent.consent, setPersistent]);

  // (2) Auto-open desktop NC on first visit when undecided.
  useEffect(() => {
    if (isMobile === false && consent.enabled && consent.consent === null) {
      setOpen(true);
    }
  }, [isMobile, consent.enabled, consent.consent, setOpen]);

  // (3) Deferred close after a user pick. Declared LAST so it runs AFTER the
  //     persistent effect — by which point setPersistent(false) has flipped
  //     persistentRef.current synchronously, so setOpen(false) here is honored.
  useEffect(() => {
    if (closeAfterChoiceRef.current && consent.consent !== null) {
      closeAfterChoiceRef.current = false;
      setOpen(false);
    }
  }, [consent.consent, setOpen]);

  const gaMount =
    consent.analyticsEnabled && gaId ? <GoogleAnalytics gaId={gaId} /> : null;

  // Capture close intent at the moment of click (before consent state updates).
  // Desktop: close only on a first-time decision so change-preference picks
  // keep NC open with the new status card for feedback.
  // Mobile: always close after picking (no panel, simpler UX).
  const handleDecline = () => {
    closeAfterChoiceRef.current = isMobile === true || consent.consent === null;
    setEditing(false);
    consent.decline();
  };
  const handleAccept = () => {
    closeAfterChoiceRef.current = isMobile === true || consent.consent === null;
    setEditing(false);
    consent.accept();
  };

  // Mobile banner — always rendered in HTML (SSR-friendly) and hidden on
  // desktop via Tailwind `lg:hidden`. The breakpoint must stay in sync with
  // `useIsMobile()`'s cutoff (1023.98 px ↔ Tailwind v4 `lg` = 1024 px).
  // `AnimatePresence initial={false}` skips the slide-in enter animation on
  // first paint so the banner is a valid LCP candidate (an opacity-0 element
  // would be ignored by the browser's LCP heuristic).
  const mobileVisible = consent.enabled && (consent.consent === null || open);
  const mobileBanner = (
    <div className="lg:hidden">
      <AnimatePresence initial={false}>
        {mobileVisible && (
          <MobileConsentNotification
            key="mobile-ga-consent"
            accept={handleAccept}
            decline={handleDecline}
          />
        )}
      </AnimatePresence>
    </div>
  );

  // Desktop card — client-gated on `isMobile === false`. Desktop is already
  // 100/100 on PSI so we don't pay the cost of SSR here.
  const desktopCard =
    isMobile === false ? (
      <NotificationCenter initialFocusRef={declineRef}>
        {consent.enabled &&
          (consent.consent === null || editing ? (
            <NotificationCard
              variant="liquid-glass"
              icon={<BarChart3 size={16} />}
              iconTileClassName="bg-accent text-accent-foreground"
              appLabel="Analytics"
              timestamp="now"
              title="Allow Analytics?"
              body="This site uses Google Analytics to understand which apps and links visitors engage with. No personal data is sold or shared."
              actions={[
                { label: "Decline", onClick: handleDecline, ref: declineRef },
                { label: "Allow", onClick: handleAccept },
              ]}
            />
          ) : (
            <NotificationCard
              variant="liquid-glass"
              icon={<BarChart3 size={16} />}
              iconTileClassName="bg-accent text-accent-foreground"
              appLabel="Analytics"
              timestamp="now"
              title={
                consent.consent === "granted"
                  ? "Analytics enabled"
                  : "Analytics disabled"
              }
              body={
                consent.consent === "granted"
                  ? "Engagement data is sent to Google Analytics. You can change your preference at any time."
                  : "No analytics data is sent. You can change your preference at any time."
              }
              actions={[
                {
                  label: "Change preference",
                  onClick: () => setEditing(true),
                },
              ]}
            />
          ))}
      </NotificationCenter>
    ) : null;

  return (
    <>
      {gaMount}
      {mobileBanner}
      {desktopCard}
    </>
  );
}
