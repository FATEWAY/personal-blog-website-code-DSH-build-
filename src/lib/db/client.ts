import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "@/lib/config";

export type DB = Database.Database;

type GlobalWithDb = typeof globalThis & {
  __fatewayDb?: DB;
};

const globalWithDb = globalThis as GlobalWithDb;

export function openDatabase(file: string): DB {
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.pragma("synchronous = NORMAL");
  return db;
}

/**
 * Single shared connection. Next.js hot reload keeps the Node process alive,
 * so the handle is cached on globalThis to avoid opening a new one per reload.
 */
export function getDb(): DB {
  if (globalWithDb.__fatewayDb) return globalWithDb.__fatewayDb;
  const db = openDatabase(config.databasePath);
  globalWithDb.__fatewayDb = db;
  return db;
}

export function closeDb(): void {
  if (globalWithDb.__fatewayDb) {
    globalWithDb.__fatewayDb.close();
    delete globalWithDb.__fatewayDb;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}
