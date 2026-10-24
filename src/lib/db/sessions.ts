import { createHash, randomBytes } from "node:crypto";
import type { AuthSession } from "@/lib/types";
import { toAdminAccount, type AdminRow } from "./admins";
import { getDb, nowIso, type DB } from "./client";

type SessionRow = {
  token_hash: string;
  admin_id: string;
  csrf_token: string;
  created_at: string;
  expires_at: string;
  last_seen_at: string | null;
  ip: string | null;
  user_agent: string | null;
};

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createSession(
  adminId: string,
  meta: { ttlHours: number; ip: string; userAgent: string },
  db: DB = getDb(),
): { token: string; csrfToken: string; expiresAt: string } {
  const token = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(32).toString("base64url");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + meta.ttlHours * 60 * 60 * 1000);

  db.prepare(
    `INSERT INTO sessions (token_hash, admin_id, csrf_token, created_at, expires_at, last_seen_at, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    hashSessionToken(token),
    adminId,
    csrfToken,
    createdAt.toISOString(),
    expiresAt.toISOString(),
    createdAt.toISOString(),
    meta.ip.slice(0, 100),
    meta.userAgent.slice(0, 300),
  );

  return { token, csrfToken, expiresAt: expiresAt.toISOString() };
}

type SessionJoinRow = SessionRow & {
  username: string;
  display_name: string;
  disabled: number;
  last_login_at: string | null;
};

export function findSession(token: string, db: DB = getDb()): AuthSession | null {
  if (!token || token.length > 200) return null;
  const tokenHash = hashSessionToken(token);
  const row = db
    .prepare(
      `SELECT s.*, a.username, a.display_name, a.disabled, a.last_login_at
       FROM sessions s JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ?`,
    )
    .get(tokenHash) as SessionJoinRow | undefined;

  if (!row) return null;
  if (row.disabled === 1) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }

  // Refresh last_seen_at at most once every ten minutes to avoid a write per request.
  const lastSeen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
  if (Date.now() - lastSeen > 10 * 60 * 1000) {
    db.prepare("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?").run(nowIso(), tokenHash);
  }

  const adminRow: AdminRow = {
    id: row.admin_id,
    username: row.username,
    password_hash: "",
    display_name: row.display_name,
    disabled: row.disabled,
    created_at: "",
    updated_at: "",
    last_login_at: row.last_login_at,
  };

  return {
    session: {
      tokenHash: row.token_hash,
      adminId: row.admin_id,
      csrfToken: row.csrf_token,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    },
    admin: toAdminAccount(adminRow),
  };
}

export function deleteSession(token: string, db: DB = getDb()): void {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashSessionToken(token));
}

export function deleteOtherSessions(adminId: string, keepTokenHash: string, db: DB = getDb()): number {
  const result = db
    .prepare("DELETE FROM sessions WHERE admin_id = ? AND token_hash <> ?")
    .run(adminId, keepTokenHash);
  return result.changes;
}

export function deleteAllSessions(adminId: string, db: DB = getDb()): void {
  db.prepare("DELETE FROM sessions WHERE admin_id = ?").run(adminId);
}

export function cleanupExpiredSessions(db: DB = getDb()): number {
  const result = db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowIso());
  return result.changes;
}
