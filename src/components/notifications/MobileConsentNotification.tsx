"use client";

import { BarChart3 } from "lucide-react";
import NotificationCard from "@/components/notifications/NotificationCard";

interface Props {
  accept: () => void;
  decline: () => void;
}

export default function MobileConsentNotification({ accept, decline }: Props) {
  return (
    <div
      className="fixed inset-x-3 z-50 mx-auto max-w-md"
      style={{
        top: "calc(env(safe-area-inset-top) + 3.25rem)",
      }}
    >
      <NotificationCard
        icon={<BarChart3 size={16} />}
        iconTileClassName="bg-accent text-accent-foreground"
        appLabel="Analytics"
        timestamp="now"
        title="Allow Analytics?"
        body="This site uses Google Analytics to understand which apps and links visitors engage with. No personal data is sold or shared."
        actions={[
          { label: "Decline", onClick: decline },
          { label: "Allow", onClick: accept },
        ]}
      />
    </div>
  );
}
