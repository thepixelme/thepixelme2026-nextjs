"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { BarChart3 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import MobileConsentNotification from "@/components/notifications/MobileConsentNotification";
import NotificationCard from "@/components/notifications/NotificationCard";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useNotificationCenter } from "@/lib/notification-center";
import { useAnalyticsConsent } from "@/lib/useAnalyticsConsent";
import { useIsMobile } from "@/lib/useIsMobile";

export default function AnalyticsConsent() {
  const consent = useAnalyticsConsent();
  const isMobile = useIsMobile();
  const { open, setOpen, setLocked } = useNotificationCenter();
  const declineRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const closeAfterChoiceRef = useRef(false);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // (1) Lock the NC while undecided. Declared FIRST so its effect runs first
  //     in declaration order — the deferred-close effect below depends on
  //     lockedRef.current being false by the time it runs.
  useEffect(() => {
    setLocked(consent.enabled && consent.consent === null);
  }, [consent.enabled, consent.consent, setLocked]);

  // (2) Auto-open desktop NC on first visit when undecided.
  useEffect(() => {
    if (isMobile === false && consent.enabled && consent.consent === null) {
      setOpen(true);
    }
  }, [isMobile, consent.enabled, consent.consent, setOpen]);

  // (3) Deferred close after a user pick. Declared LAST so it runs AFTER the
  //     lock effect — by which point setLocked(false) has flipped
  //     lockedRef.current synchronously, so setOpen(false) here is honored.
  useEffect(() => {
    if (closeAfterChoiceRef.current && consent.consent !== null) {
      closeAfterChoiceRef.current = false;
      setOpen(false);
    }
  }, [consent.consent, setOpen]);

  if (!consent.mounted || isMobile === null) return null;

  const gaMount =
    consent.analyticsEnabled && gaId ? <GoogleAnalytics gaId={gaId} /> : null;

  // Capture close intent at the moment of click (before consent state updates).
  // Desktop: close only on a first-time decision so change-preference picks
  // keep NC open with the new status card for feedback.
  // Mobile: always close after picking (no panel, simpler UX).
  const handleDecline = () => {
    closeAfterChoiceRef.current = isMobile || consent.consent === null;
    setEditing(false);
    consent.decline();
  };
  const handleAccept = () => {
    closeAfterChoiceRef.current = isMobile || consent.consent === null;
    setEditing(false);
    consent.accept();
  };

  // Mobile: standalone card. Gated on `consent === null || open` — the
  // `consent === null` clause keeps the card visible the entire undecided
  // period, including after a failed Accept (where promptVisible flips false
  // but consent stays null).
  if (isMobile) {
    const mobileVisible = consent.enabled && (consent.consent === null || open);
    return (
      <>
        {gaMount}
        <AnimatePresence>
          {mobileVisible && (
            <MobileConsentNotification
              key="mobile-ga-consent"
              accept={handleAccept}
              decline={handleDecline}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: NC always rendered when env is set; card content varies by state.
  // When env is unset, NC still mounts (empty) so the clock can open it.
  return (
    <>
      {gaMount}
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
    </>
  );
}
