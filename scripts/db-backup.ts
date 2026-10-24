import fs from "node:fs/promises";
import path from "node:path";
import { loadEnv } from "./lib/env";

loadEnv();

async function main() {
  const { getDb, closeDb } = await import("@/lib/db/client");

  const directory = path.resolve(process.cwd(), "storage", "backups");
  await fs.mkdir(directory, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destination = path.join(directory, `fateway-${stamp}.db`);

  const db = getDb();
  await db.backup(destination);
  closeDb();

  const stat = await fs.stat(destination);
  console.log(`备份已创建：${destination}`);
  console.log(`大小：${(stat.size / 1024).toFixed(1)} KB`);
  console.log("提示：媒体文件位于 UPLOAD_DIR，请与数据库备份一起归档。");
}

main().catch((error: unknown) => {
  console.error(`备份失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
