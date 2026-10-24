import { cache } from "react";
import { cloneDefaultSettings, mergeSiteSettings } from "@/lib/defaults";
import type { SiteSettings } from "@/lib/types";
import { getDb, nowIso, type DB } from "./client";

const SETTINGS_KEY = "site";

export function loadSiteSettings(db: DB = getDb()): SiteSettings {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(SETTINGS_KEY) as
    | { value: string }
    | undefined;
  if (!row) return cloneDefaultSettings();

  try {
    return mergeSiteSettings(cloneDefaultSettings(), JSON.parse(row.value));
  } catch {
    // Corrupted settings must never break the public site.
    return cloneDefaultSettings();
  }
}

/** Request-scoped memoisation so a page reads settings only once. */
export const getSiteSettings = cache((): SiteSettings => loadSiteSettings());

export function saveSiteSettings(settings: SiteSettings, db: DB = getDb()): SiteSettings {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(SETTINGS_KEY, JSON.stringify(settings), nowIso());
  return mergeSiteSettings(cloneDefaultSettings(), settings);
}
