"use client";

import { Command } from "@heroui-pro/react";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { APPS } from "@/components/apps/registry";
import { useWindowsDispatch } from "@/lib/windows-store";
import type { AppId } from "@/types/window";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Spotlight({ open, onOpenChange }: Props) {
  const dispatch = useWindowsDispatch();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  const launch = (id: AppId) => {
    dispatch({ type: "OPEN", appId: id });
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Command>
      <Command.Backdrop isOpen={open} onOpenChange={onOpenChange}>
        <Command.Container>
          <Command.Dialog>
            <Command.InputGroup
              value={query}
              onChange={setQuery}
              aria-label="Spotlight search"
            >
              <Command.InputGroup.Prefix>
                <Search size={16} />
              </Command.InputGroup.Prefix>
              <Command.InputGroup.Input placeholder="Spotlight Search" />
            </Command.InputGroup>
            <Command.List
              aria-label="Apps"
              onAction={(key) => launch(key as AppId)}
            >
              <Command.Group heading="Apps">
                {APPS.map((app) => {
                  const Icon = app.icon;
                  return (
                    <Command.Item
                      key={app.id}
                      id={app.id}
                      textValue={app.title}
                    >
                      <Icon size={16} />
                      <span className="ml-2">{app.title}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            </Command.List>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
}
