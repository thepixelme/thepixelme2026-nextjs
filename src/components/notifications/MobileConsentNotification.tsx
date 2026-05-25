"use client";

import { BarChart3 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import NotificationCard from "@/components/notifications/NotificationCard";

interface Props {
  accept: () => void;
  decline: () => void;
}

export default function MobileConsentNotification({ accept, decline }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+3.25rem)] z-50 mx-auto max-w-md"
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 320, damping: 32 }
      }
    >
      <NotificationCard
        variant="liquid-glass"
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
    </motion.div>
  );
}
