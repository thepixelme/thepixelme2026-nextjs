import {
  type ConsentValue,
  GA_CONSENT_COOKIE,
  parseConsent,
} from "@/lib/analytics-consent";
import type { ProjectTag } from "@/lib/projects";
import { MOBILE_MEDIA_QUERY } from "@/lib/useIsMobile";
import type { AppId, AppOpenSource } from "@/types/window";

export type { ConsentValue };
export { GA_CONSENT_COOKIE, parseConsent };

// 1 year, renewed on each accept/decline.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${GA_CONSENT_COOKIE}=([^;]+)`),
  );
  return parseConsent(match?.[1]);
}

/** Returns true if the value was persisted (verified by read-back), false otherwise. */
export function writeConsent(value: ConsentValue): boolean {
  if (typeof document === "undefined") return false;
  try {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is not supported in Safari; direct assignment is intentional. Read-back below verifies persistence regardless of the rejection path.
    document.cookie = `${GA_CONSENT_COOKIE}=${value}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    // document.cookie assignment doesn't throw when the browser rejects the
    // cookie (third-party blocking, quota, malformed value). Read back to
    // verify — preserves fail-closed posture on Accept-with-storage-failure.
    return readConsent() === value;
  } catch {
    return false;
  }
}

export type OutboundSurface =
  | "about_social"
  | "project_link"
  | "project_source";

export type TerminalCommand =
  | "help"
  | "whoami"
  | "ls"
  | "cat"
  | "clear"
  | "unknown";

// Every variant is documented in docs/analytics-events.md — keep the two in
// sync. `link_url`, `link_domain`, `method` and `percent_scrolled` reuse GA4's
// built-in dimensions; every other param must be registered as a custom
// dimension in GA before it shows up in reports.
type GAEvent =
  | {
      name: "intro_complete";
      method: "scroll" | "click" | "keyboard" | "skip";
      seconds_to_enter: number;
    }
  | { name: "app_open"; app_id: AppId; opened_from: AppOpenSource }
  | {
      name: "window_action";
      app_id: AppId;
      action: "close" | "minimize" | "maximize" | "restore";
    }
  | { name: "spotlight_open"; method: "shortcut" | "click" }
  | { name: "spotlight_select"; app_id: AppId; query_length: number }
  | { name: "project_view"; project_id: string; opened_from: AppOpenSource }
  | { name: "finder_filter"; filter_tag: ProjectTag | "all" }
  | {
      name: "screenshot_view";
      project_id: string;
      screenshot_index: number;
      opened_from: "case_study" | "sidebar" | "viewer";
    }
  | {
      name: "case_study_scroll";
      project_id: string;
      percent_scrolled: 25 | 50 | 75 | 100;
    }
  | {
      name: "outbound_click";
      link_url: string;
      link_domain: string;
      surface: OutboundSurface;
      project_id?: string;
    }
  | { name: "contact_form_start" }
  | {
      name: "contact_form_submit";
      subject_length: number;
      message_length: number;
    }
  | {
      name: "contact_form_error";
      error_type: "rate_limit" | "validation" | "server" | "network";
    }
  | {
      name: "terminal_command";
      command: TerminalCommand;
      command_target?: "projects" | "about.md" | "other";
    };

type EventParams = Record<string, string | number>;
type Gtag = (command: "event", name: string, params: EventParams) => void;

// Events can fire before gtag's init script has run: <GoogleAnalytics> mounts
// inside AnalyticsConsent, which streams in under Suspense after the desktop
// hydrates. Those wait here until AnalyticsConsent calls flushPendingEvents().
const MAX_PENDING_EVENTS = 50;
let pending: [string, EventParams][] = [];

function getGtag(): Gtag | undefined {
  const gtag = (window as { gtag?: unknown }).gtag;
  return typeof gtag === "function" ? (gtag as Gtag) : undefined;
}

export function trackEvent(event: GAEvent) {
  if (typeof window === "undefined") return;
  if (readConsent() !== "granted") return;
  if (!process.env.NEXT_PUBLIC_GA_ID) return;
  const { name, ...rest } = event;
  const params: EventParams = {
    // Which shell the visitor was looking at — the same split as useIsMobile().
    shell: window.matchMedia(MOBILE_MEDIA_QUERY).matches ? "mobile" : "desktop",
  };
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) params[key] = value;
  }
  const gtag = getGtag();
  if (gtag) gtag("event", name, params);
  else if (pending.length < MAX_PENDING_EVENTS) pending.push([name, params]);
}

/** Sends events queued before gtag existed. No-op until it does. */
export function flushPendingEvents() {
  const gtag = getGtag();
  if (!gtag) return;
  for (const [name, params] of pending) gtag("event", name, params);
  pending = [];
}

/** `outbound_click`, with `link_domain` derived from the URL. */
export function trackOutboundClick(
  url: string,
  surface: OutboundSurface,
  projectId?: string,
) {
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch {
    // Relative or malformed URL — send the event without a domain.
  }
  trackEvent({
    name: "outbound_click",
    link_url: url,
    link_domain: domain,
    surface,
    project_id: projectId,
  });
}
