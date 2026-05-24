"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { BarChart3 } from "lucide-react";
import { useEffect, useRef } from "react";
import MobileConsentNotification from "@/components/notifications/MobileConsentNotification";
import NotificationCard from "@/components/notifications/NotificationCard";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useNotificationCenter } from "@/lib/notification-center";
import { useAnalyticsConsent } from "@/lib/useAnalyticsConsent";
import { useIsMobile } from "@/lib/useIsMobile";

export default function AnalyticsConsent() {
  const consent = useAnalyticsConsent();
  const isMobile = useIsMobile();
  const { setOpen } = useNotificationCenter();
  const declineRef = useRef<HTMLButtonElement>(null);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Auto-open the desktop Notification Center when the prompt becomes visible.
  // Desktop-only: mobile must not mutate shared NC state, otherwise a later
  // resize from mobile to desktop would reveal an already-open panel.
  useEffect(() => {
    if (isMobile === false && consent.promptVisible) {
      setOpen(true);
    }
  }, [isMobile, consent.promptVisible, setOpen]);

  if (!consent.mounted || isMobile === null) return null;

  const gaMount =
    consent.analyticsEnabled && gaId ? <GoogleAnalytics gaId={gaId} /> : null;

  if (isMobile) {
    return (
      <>
        {gaMount}
        {consent.promptVisible && (
          <MobileConsentNotification
            accept={consent.accept}
            decline={consent.decline}
          />
        )}
      </>
    );
  }

  return (
    <>
      {gaMount}
      <NotificationCenter initialFocusRef={declineRef}>
        {consent.promptVisible && (
          <NotificationCard
            icon={<BarChart3 size={16} />}
            iconTileClassName="bg-accent text-accent-foreground"
            appLabel="Analytics"
            timestamp="now"
            title="Allow Analytics?"
            body="This site uses Google Analytics to understand which apps and links visitors engage with. No personal data is sold or shared."
            actions={[
              { label: "Decline", onClick: consent.decline, ref: declineRef },
              { label: "Allow", onClick: consent.accept },
            ]}
          />
        )}
      </NotificationCenter>
    </>
  );
}
