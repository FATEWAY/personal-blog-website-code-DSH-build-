import fs from "node:fs";
import path from "node:path";
import { config } from "@/lib/config";
import { getDb, type DB } from "./client";

export type MigrationResult = {
  applied: string[];
  skipped: string[];
};

/**
 * Applies pending SQL migrations in filename order, each in its own
 * transaction. The schema_migrations table is the source of truth.
 */
export function runMigrations(db: DB = getDb(), directory: string = config.migrationsDir): MigrationResult {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  if (!fs.existsSync(directory)) {
    throw new Error(`Migration directory not found: ${directory}`);
  }

  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  const appliedRows = db.prepare("SELECT name FROM schema_migrations").all() as { name: string }[];
  const appliedSet = new Set(appliedRows.map((row) => row.name));

  const result: MigrationResult = { applied: [], skipped: [] };
  const record = db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)");

  for (const file of files) {
    if (appliedSet.has(file)) {
      result.skipped.push(file);
      continue;
    }
    const sql = fs.readFileSync(path.join(directory, file), "utf8");
    const apply = db.transaction(() => {
      db.exec(sql);
      record.run(file, new Date().toISOString());
    });
    apply();
    result.applied.push(file);
  }

  return result;
}

export function pendingMigrations(db: DB = getDb(), directory: string = config.migrationsDir): string[] {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  if (!fs.existsSync(directory)) return [];
  const applied = new Set(
    (db.prepare("SELECT name FROM schema_migrations").all() as { name: string }[]).map((row) => row.name),
  );
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".sql") && !applied.has(file))
    .sort((a, b) => a.localeCompare(b));
}
