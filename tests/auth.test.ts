import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAdmin, findAdminById, updateAdminPassword } from "@/lib/db/admins";
import { openDatabase } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import {
  createSession,
  deleteSession,
  findSession,
  hashSessionToken,
} from "@/lib/db/sessions";
import {
  checkLoginThrottle,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/auth/rate-limit";

let db: Database.Database;

const DUMMY_HASH = "scrypt$16384$8$1$c2FsdA$aGFzaA";

beforeEach(() => {
  db = openDatabase(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

function makeAdmin(username = "admin") {
  return createAdmin(
    {
      id: randomUUID(),
      username,
      passwordHash: DUMMY_HASH,
      displayName: "站长",
    },
    db,
  );
}

describe("admin + session management", () => {
  it("creates a session and resolves the administrator", () => {
    const admin = makeAdmin();
    const { token } = createSession(
      admin.id,
      { ttlHours: 1, ip: "127.0.0.1", userAgent: "vitest" },
      db,
    );

    expect(token).toHaveLength(43);

    const row = db.prepare("SELECT token_hash FROM sessions").get() as { token_hash: string };
    expect(row.token_hash).not.toBe(token);
    expect(row.token_hash).toBe(hashSessionToken(token));

    const session = findSession(token, db);
    expect(session?.admin.username).toBe("admin");
    expect(session?.admin.displayName).toBe("站长");
  });

  it("rejects unknown, expired and disabled sessions", () => {
    const admin = makeAdmin();
    const expired = createSession(
      admin.id,
      { ttlHours: -1, ip: "127.0.0.1", userAgent: "vitest" },
      db,
    );
    expect(findSession(expired.token, db)).toBeNull();

    const valid = createSession(
      admin.id,
      { ttlHours: 1, ip: "127.0.0.1", userAgent: "vitest" },
      db,
    );
    db.prepare("UPDATE admins SET disabled = 1 WHERE id = ?").run(admin.id);
    expect(findSession(valid.token, db)).toBeNull();

    expect(findSession("not-a-real-token", db)).toBeNull();
  });

  it("deletes a session on logout", () => {
    const admin = makeAdmin();
    const { token } = createSession(
      admin.id,
      { ttlHours: 1, ip: "127.0.0.1", userAgent: "vitest" },
      db,
    );
    deleteSession(token, db);
    expect(findSession(token, db)).toBeNull();
  });

  it("updates the stored password hash", () => {
    const admin = makeAdmin();
    updateAdminPassword(admin.id, "scrypt$16384$8$1$bmV3$bmV3aGFzaA", db);
    expect(findAdminById(admin.id, db)?.password_hash).toContain("bmV3aGFzaA");
  });
});

describe("login throttling", () => {
  const ip = "203.0.113.10";
  const identifier = "fateway";

  it("allows attempts before the threshold", () => {
    expect(checkLoginThrottle(identifier, ip, db).allowed).toBe(true);
    recordLoginFailure(identifier, ip, db);
    expect(checkLoginThrottle(identifier, ip, db).remaining).toBe(4);
  });

  it("locks the identity after five failures and clears on success", () => {
    for (let index = 0; index < 5; index += 1) {
      recordLoginFailure(identifier, ip, db);
    }

    const locked = checkLoginThrottle(identifier, ip, db);
    expect(locked.allowed).toBe(false);
    expect(locked.retryAfterSeconds).toBeGreaterThan(0);

    recordLoginSuccess(identifier, ip, db);
    expect(checkLoginThrottle(identifier, ip, db).allowed).toBe(true);
  });

  it("does not lock a different identity from the same IP below the IP limit", () => {
    for (let index = 0; index < 5; index += 1) {
      recordLoginFailure("another-user", "198.51.100.20", db);
    }
    expect(checkLoginThrottle(identifier, ip, db).allowed).toBe(true);
  });
});
