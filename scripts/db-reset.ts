import { createInterface } from "node:readline/promises";
import fs from "node:fs";
import { loadEnv, parseArgs } from "./lib/env";

loadEnv();

async function confirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(question)).trim().toLowerCase();
    return answer === "yes" || answer === "y";
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { config } = await import("@/lib/config");
  const { closeDb, getDb } = await import("@/lib/db/client");
  const { runMigrations } = await import("@/lib/db/migrate");
  const { seedDatabase } = await import("@/lib/db/seed");

  if (config.isProduction && args["force-production"] !== true) {
    console.error("拒绝在 production 环境重置数据库。确需操作请加 --force-production。");
    process.exitCode = 1;
    return;
  }

  const confirmed = args.yes === true || (await confirm("将删除现有数据库并重新初始化，输入 yes 继续："));
  if (!confirmed) {
    console.log("已取消。");
    return;
  }

  closeDb();
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${config.databasePath}${suffix}`;
    if (fs.existsSync(file)) fs.rmSync(file);
  }

  const db = getDb();
  runMigrations(db);
  console.log("数据库已重新创建。");

  if (args["no-seed"] !== true) {
    const result = seedDatabase(db);
    console.log(`已写入示例文章 ${result.insertedPosts} 篇、示例项目 ${result.insertedProjects} 个。`);
  }
  closeDb();
}

main().catch((error: unknown) => {
  console.error(`重置失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
