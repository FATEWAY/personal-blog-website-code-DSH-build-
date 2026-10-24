import { cache } from "react";
import { DEFAULT_SETTINGS } from "./defaults";
import { getSiteSettings } from "./db/settings";
import type { SiteSettings } from "./types";

/**
 * Settings access that can never break a page: an empty or not-yet-migrated
 * database falls back to neutral defaults (also used during `next build`).
 */
export const getSiteConfig = cache((): SiteSettings => {
  try {
    return getSiteSettings();
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
});
