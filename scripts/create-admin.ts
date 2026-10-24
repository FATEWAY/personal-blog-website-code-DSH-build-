import { createInterface } from "node:readline/promises";
import { randomUUID } from "node:crypto";
import { loadEnv, parseArgs } from "./lib/env";

loadEnv();

function promptHidden(question: string): Promise<string> {
  const stdin = process.stdin;
  if (!stdin.isTTY) {
    return Promise.reject(new Error("当前终端不支持隐藏输入，请改用 ADMIN_INIT_PASSWORD 环境变量"));
  }

  return new Promise((resolve, reject) => {
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
    };

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          cleanup();
          process.stdout.write("\n");
          reject(new Error("已取消"));
          return;
        }
        if (char === "\u007f" || char === "\b") {
          value = Array.from(value).slice(0, -1).join("");
          continue;
        }
        if (char >= " ") value += char;
      }
    };

    stdin.on("data", onData);
  });
}

async function promptText(question: string, defaultValue?: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return defaultValue ?? "";
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(question)).trim();
    return answer || defaultValue || "";
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { config } = await import("@/lib/config");
  const { getDb, closeDb } = await import("@/lib/db/client");
  const { runMigrations } = await import("@/lib/db/migrate");
  const { countAdmins, createAdmin, findAdminByUsername, updateAdminPassword } = await import(
    "@/lib/db/admins"
  );
  const { deleteAllSessions } = await import("@/lib/db/sessions");
  const { hashPassword } = await import("@/lib/auth/password");
  const { validatePasswordStrength } = await import("@/lib/validation");

  const db = getDb();
  runMigrations(db, config.migrationsDir);

  const total = countAdmins(db);
  const force = args.force === true;

  if (total > 0 && !force) {
    console.error(
      [
        "",
        "已经存在管理员账户，初始化脚本不会覆盖它。",
        "如需重置密码，请执行：",
        "  npm run admin:create -- --force --username <你的用户名>",
        "",
      ].join("\n"),
    );
    closeDb();
    process.exitCode = 1;
    return;
  }

  let username = String(args.username ?? process.env.ADMIN_INIT_USERNAME ?? "").trim();
  if (!username) {
    username = await promptText("管理员用户名（3–32 位，字母/数字/._-）：");
  }

  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
    console.error("用户名不合法：需 3–32 位，仅允许字母、数字、点、下划线和连字符。");
    closeDb();
    process.exitCode = 1;
    return;
  }

  const existing = findAdminByUsername(username, db);
  if (total > 0 && force && !existing) {
    console.error(`未找到用户名为 “${username}” 的管理员，无法重置。`);
    closeDb();
    process.exitCode = 1;
    return;
  }

  let password = process.env.ADMIN_INIT_PASSWORD ?? "";
  if (!password) {
    password = await promptHidden("设置管理员密码（输入不会显示）：");
    const confirm = await promptHidden("再次输入密码：");
    if (password !== confirm) {
      console.error("两次输入的密码不一致。");
      closeDb();
      process.exitCode = 1;
      return;
    }
  }

  const strengthError = validatePasswordStrength(password, username);
  if (strengthError) {
    console.error(`密码不符合要求：${strengthError}`);
    closeDb();
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);

  if (existing) {
    updateAdminPassword(existing.id, passwordHash, db);
    deleteAllSessions(existing.id, db);
    console.log(`\n已重置管理员 “${existing.username}” 的密码，并注销了全部旧会话。`);
  } else {
    const admin = createAdmin(
      {
        id: randomUUID(),
        username,
        passwordHash,
        displayName: String(args["display-name"] ?? username),
      },
      db,
    );
    console.log(`\n已创建管理员 “${admin.username}”。`);
  }

  const adminPath = config.adminPath === "/" ? "/admin" : config.adminPath;
  console.log(`登录地址：${config.siteUrl}${adminPath}/login`);
  console.log("请妥善保存密码，并尽快通过后台“账户安全”页面确认登录状态。\n");

  closeDb();
}

main().catch((error: unknown) => {
  console.error(`\n初始化失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
