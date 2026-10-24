import path from "node:path";
import { normalizeAdminPath } from "./route-path";

function normalizeSiteUrl(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "http://localhost:3000";
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "http://localhost:3000";
    }
    return url.origin + (url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, ""));
  } catch {
    return "http://localhost:3000";
  }
}

function readInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function readBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  return /^(1|true|yes|on)$/i.test(raw.trim());
}

const cwd = process.cwd();

export const config = {
  siteUrl: normalizeSiteUrl(process.env.SITE_URL),
  siteName: process.env.SITE_NAME?.trim() || "fateway",
  adminPath: normalizeAdminPath(process.env.ADMIN_PATH),
  databasePath: path.resolve(cwd, process.env.DATABASE_PATH?.trim() || "data/fateway.db"),
  uploadDir: path.resolve(cwd, process.env.UPLOAD_DIR?.trim() || "storage/uploads"),
  migrationsDir: path.resolve(cwd, "migrations"),
  sessionCookieName: process.env.SESSION_COOKIE_NAME?.trim() || "fw_session",
  sessionTtlHours: readInt("SESSION_TTL_HOURS", 168, 1, 720),
  maxUploadBytes: readInt("MAX_UPLOAD_MB", 5, 1, 20) * 1024 * 1024,
  trustProxy: readBool("TRUST_PROXY", false),
  isProduction: process.env.NODE_ENV === "production",
  get secureCookies(): boolean {
    return this.isProduction || this.siteUrl.startsWith("https://");
  },
} as const;

export type AppConfig = typeof config;
