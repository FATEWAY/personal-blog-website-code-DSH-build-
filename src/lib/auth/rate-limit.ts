import { getDb, nowIso, type DB } from "@/lib/db/client";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IDENTITY = 5;
const MAX_FAILURES_PER_IP = 20;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export type LoginThrottle = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

/**
 * Database-backed login throttling. It survives restarts and works across
 * multiple Node processes because the counters live in SQLite.
 */
export function checkLoginThrottle(identifier: string, ip: string, db: DB = getDb()): LoginThrottle {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();

  const identityFailures = (
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM login_attempts
         WHERE success = 0 AND identifier = ? AND ip = ? AND created_at > ?`,
      )
      .get(normalizedIdentifier, ip, cutoff) as { count: number }
  ).count;

  const ipFailures = (
    db
      .prepare("SELECT COUNT(*) AS count FROM login_attempts WHERE success = 0 AND ip = ? AND created_at > ?")
      .get(ip, cutoff) as { count: number }
  ).count;

  if (identityFailures < MAX_FAILURES_PER_IDENTITY && ipFailures < MAX_FAILURES_PER_IP) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: MAX_FAILURES_PER_IDENTITY - identityFailures,
    };
  }

  const oldest = db
    .prepare(
      `SELECT MIN(created_at) AS first FROM login_attempts
       WHERE success = 0 AND created_at > ? AND (ip = ? OR (identifier = ? AND ip = ?))`,
    )
    .get(cutoff, ip, normalizedIdentifier, ip) as { first: string | null };

  const firstTime = oldest.first ? new Date(oldest.first).getTime() : Date.now();
  const retryAfterSeconds = Math.max(30, Math.ceil((firstTime + WINDOW_MS - Date.now()) / 1000));

  return { allowed: false, retryAfterSeconds, remaining: 0 };
}

export function recordLoginFailure(identifier: string, ip: string, db: DB = getDb()): void {
  db.prepare("INSERT INTO login_attempts (identifier, ip, success, created_at) VALUES (?, ?, 0, ?)").run(
    identifier.trim().toLowerCase(),
    ip,
    nowIso(),
  );
  pruneOldAttempts(db);
}

export function recordLoginSuccess(identifier: string, ip: string, db: DB = getDb()): void {
  db.prepare("DELETE FROM login_attempts WHERE identifier = ? AND ip = ?").run(
    identifier.trim().toLowerCase(),
    ip,
  );
  db.prepare("INSERT INTO login_attempts (identifier, ip, success, created_at) VALUES (?, ?, 1, ?)").run(
    identifier.trim().toLowerCase(),
    ip,
    nowIso(),
  );
  pruneOldAttempts(db);
}

function pruneOldAttempts(db: DB): void {
  const cutoff = new Date(Date.now() - RETENTION_MS).toISOString();
  db.prepare("DELETE FROM login_attempts WHERE created_at < ?").run(cutoff);
}
