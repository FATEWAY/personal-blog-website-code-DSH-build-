import path from "node:path";
import { loadEnv } from "./lib/env";

loadEnv();

async function main() {
  const { config } = await import("@/lib/config");
  const { getDb, closeDb } = await import("@/lib/db/client");
  const { seedDatabase } = await import("@/lib/db/seed");

  const db = getDb();
  const result = seedDatabase(db, { seedDir: path.resolve(process.cwd(), "seed", "posts") });

  console.log(`数据库：${config.databasePath}`);
  if (result.skipped) {
    console.log("已有文章，跳过示例文章写入（不会覆盖现有内容）。");
  } else {
    console.log(`已写入示例文章 ${result.insertedPosts} 篇。`);
  }
  console.log(`已写入示例项目 ${result.insertedProjects} 个。`);
  if (result.settingsInitialised) console.log("已初始化默认站点设置。");
  console.log("示例内容均带有“示例”标记，可在后台修改或删除。");
  closeDb();
}

main().catch((error: unknown) => {
  console.error(`写入示例数据失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
