// Vault402 — shared Playwright session for storefront tools.
//
// Ported from Agentry's tools/_session.py (see CLAUDE.md's Start Fresh note — general
// pattern reused, not a deployment or dataset). One persistent, already-logged-in
// browser profile and one live page per platform, reused across calls within a
// process so cart state survives from search through checkout.
//
// The profile directory is NOT copied into this repo — it stays at its original path
// (the one Agentry's scripts/capture_session.py already logged in) and is referenced
// via ZEPTO_SESSION_DIR (see .env.example). Real login cookies never get duplicated
// or committed anywhere.

import { chromium, type BrowserContext, type Page } from "playwright";
import { env } from "../config/env.js";

export const DEFAULT_PLATFORM = "zepto";
export const STOREFRONT_URL = "https://www.zepto.com";

const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

let context: BrowserContext | null = null;
let page: Page | null = null;

/**
 * Returns the shared, already-navigated-if-possible page for this process. Launches
 * the persistent profile (real logged-in cookies, at ZEPTO_SESSION_DIR) on first use.
 */
export async function getPage(headless = true): Promise<Page> {
  if (!context) {
    const sessionDir = env.zeptoSessionDir();
    context = await chromium.launchPersistentContext(sessionDir, {
      headless,
      // Playwright defaults headless Chromium to the stripped-down "headless shell"
      // build, which fails to render JS-heavy SPAs like Zepto's (blank page). The
      // "chromium" channel uses full Chromium in its newer headless mode instead.
      channel: "chromium",
      args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
      userAgent: USER_AGENT,
      viewport: { width: 390, height: 844 },
      locale: "en-IN",
      geolocation: { latitude: 12.9903, longitude: 80.2456 },
      permissions: ["geolocation"],
    });
    await context.addInitScript(
      "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
    );
  }

  if (!page || page.isClosed()) {
    page = context.pages()[0] ?? (await context.newPage());
  }

  return page;
}

export async function closeSession(): Promise<void> {
  if (context) {
    await context.close();
    context = null;
    page = null;
  }
}

/** Clicks the first visible button/link/div whose text matches `pattern` (case-insensitive). */
export async function jsClick(p: Page, pattern: string): Promise<boolean> {
  return p.evaluate((pat: string) => {
    const re = new RegExp(pat, "i");
    const candidates = [
      ...Array.from(document.querySelectorAll("button")),
      ...Array.from(document.querySelectorAll('div[role="button"], a, div, span')),
    ];
    const el = candidates.find(
      (b) => re.test(b.textContent?.trim() ?? "") && (b as HTMLElement).offsetParent !== null
    );
    if (el) {
      (el as HTMLElement).click();
      return true;
    }
    return false;
  }, pattern);
}
