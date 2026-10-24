/**
 * PM2 / 宝塔 Node 项目启动入口。
 *
 * 宝塔的 PM2 项目需要一个 JS 启动文件，而 Next.js 没有 server.js。
 * 这个包装器负责：
 *   1. 进入项目根目录（PM2 的 cwd 也设为这里）
 *   2. 显式加载 .env.production
 *   3. 把 DATABASE_PATH / UPLOAD_DIR 解析成项目内的绝对路径
 *   4. 检查 SQLite 数据库是否存在、目录是否可写
 *   5. 用当前 Node 启动 Next.js production server
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

process.env.NODE_ENV = "production";

const envFile = path.join(__dirname, ".env.production");
if (fs.existsSync(envFile)) {
  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(envFile);
    } else {
      // Node 20.9–20.11 compatibility: reuse Next.js's env loader.
      require("@next/env").loadEnvConfig(__dirname, false);
    }
  } catch (error) {
    console.error(`[startup] Failed to load ${envFile}:`, error.message);
    process.exit(1);
  }
} else {
  console.warn("[startup] .env.production not found; falling back to default settings");
}

const databasePath = path.resolve(
  __dirname,
  process.env.DATABASE_PATH || "./data/fateway.db",
);
const uploadDir = path.resolve(
  __dirname,
  process.env.UPLOAD_DIR || "./storage/uploads",
);

process.env.DATABASE_PATH = databasePath;
process.env.UPLOAD_DIR = uploadDir;

try {
  const stat = fs.statSync(databasePath);
  if (!stat.isFile()) throw new Error("not a regular file");
  fs.accessSync(databasePath, fs.constants.R_OK | fs.constants.W_OK);
  fs.accessSync(path.dirname(databasePath), fs.constants.W_OK);
} catch (error) {
  console.error(`[startup] Database is not readable/writable: ${databasePath}`);
  console.error(`[startup] ${error.message}`);
  console.error("[startup] Check data/ ownership and .env.production.");
  process.exit(1);
}

const nextBin = path.join(
  __dirname,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

if (!fs.existsSync(nextBin)) {
  console.error(`[startup] Next.js binary not found: ${nextBin}`);
  console.error("[startup] Run `npm ci` in the project directory first.");
  process.exit(1);
}

const buildIdPath = path.join(__dirname, ".next", "BUILD_ID");
if (!fs.existsSync(buildIdPath)) {
  console.error(`[startup] Production build not found: ${buildIdPath}`);
  console.error("[startup] Run `npm run build` in the project directory first.");
  process.exit(1);
}

const port = process.env.PORT || "3000";

console.log(`[startup] cwd: ${__dirname}`);
console.log(`[startup] database: ${databasePath}`);
console.log(`[startup] uploads: ${uploadDir}`);
console.log(`[startup] starting Next.js on port ${port}`);

const child = spawn(process.execPath, [nextBin, "start", "-p", port], {
  cwd: __dirname,
  stdio: "inherit",
  env: process.env,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}

child.on("error", (error) => {
  console.error("[startup] Failed to start Next.js:", error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
