import { loadEnv } from "./lib/env";

loadEnv();

async function main() {
  const { config } = await import("@/lib/config");
  const { getDb, closeDb } = await import("@/lib/db/client");
  const { runMigrations, pendingMigrations } = await import("@/lib/db/migrate");

  const db = getDb();
  const before = pendingMigrations(db, config.migrationsDir);
  const result = runMigrations(db, config.migrationsDir);

  console.log(`数据库：${config.databasePath}`);
  console.log(`待执行迁移：${before.length === 0 ? "无" : before.join(", ")}`);
  if (result.applied.length > 0) {
    console.log(`已应用：${result.applied.join(", ")}`);
  } else {
    console.log("已是最新状态，无需迁移。");
  }
  closeDb();
}

main().catch((error: unknown) => {
  console.error(`迁移失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
