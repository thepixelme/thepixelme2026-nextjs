"use client";

import { ContextMenu } from "@heroui-pro/react";
import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { siGithub } from "simple-icons";
import BrandIcon from "@/components/BrandIcon";
import { useWindowsDispatch } from "@/lib/windows-store";

interface Props {
  children: ReactNode;
}

export default function DesktopContextMenu({ children }: Props) {
  const dispatch = useWindowsDispatch();

  return (
    <ContextMenu>
      <ContextMenu.Trigger className="absolute inset-0 pt-7 pb-24">
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu
          onAction={(key) => {
            if (key === "about") dispatch({ type: "OPEN", appId: "about" });
            if (key === "github") window.open("https://github.com/", "_blank");
          }}
        >
          <ContextMenu.Item id="about" textValue="About This Mac">
            <Info size={14} />
            <span className="ml-2">About This Mac</span>
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item id="github" textValue="View on GitHub">
            <BrandIcon icon={siGithub} size={14} />
            <span className="ml-2">View on GitHub</span>
          </ContextMenu.Item>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  );
}
