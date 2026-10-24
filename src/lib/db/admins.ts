import type { AdminAccount } from "@/lib/types";
import { getDb, nowIso, type DB } from "./client";

export type AdminRow = {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  disabled: number;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export function toAdminAccount(row: AdminRow): AdminAccount {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    lastLoginAt: row.last_login_at,
  };
}

export function findAdminByUsername(username: string, db: DB = getDb()): AdminRow | null {
  const row = db
    .prepare("SELECT * FROM admins WHERE username = ? COLLATE NOCASE")
    .get(username) as AdminRow | undefined;
  return row ?? null;
}

export function findAdminById(id: string, db: DB = getDb()): AdminRow | null {
  const row = db.prepare("SELECT * FROM admins WHERE id = ?").get(id) as AdminRow | undefined;
  return row ?? null;
}

export function countAdmins(db: DB = getDb()): number {
  const row = db.prepare("SELECT COUNT(*) AS count FROM admins").get() as { count: number };
  return row.count;
}

export function createAdmin(
  input: { id: string; username: string; passwordHash: string; displayName?: string },
  db: DB = getDb(),
): AdminAccount {
  const timestamp = nowIso();
  db.prepare(
    `INSERT INTO admins (id, username, password_hash, display_name, disabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?)`,
  ).run(input.id, input.username, input.passwordHash, input.displayName?.trim() || input.username, timestamp, timestamp);

  const row = findAdminById(input.id, db);
  if (!row) throw new Error("Failed to create administrator");
  return toAdminAccount(row);
}

export function updateAdminPassword(adminId: string, passwordHash: string, db: DB = getDb()): void {
  const result = db
    .prepare("UPDATE admins SET password_hash = ?, updated_at = ? WHERE id = ?")
    .run(passwordHash, nowIso(), adminId);
  if (result.changes === 0) throw new Error("Administrator not found");
}

export function recordAdminLogin(adminId: string, db: DB = getDb()): void {
  const timestamp = nowIso();
  db.prepare("UPDATE admins SET last_login_at = ?, updated_at = ? WHERE id = ?").run(
    timestamp,
    timestamp,
    adminId,
  );
}
