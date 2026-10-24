import fs from "node:fs";
import path from "node:path";

/**
 * Loads .env then .env.local for CLI scripts. Variables that already exist in
 * the shell take precedence (process.loadEnvFile does not overwrite them).
 */
export function loadEnv(): void {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const files = [".env", `.env.${nodeEnv}`, ".env.local", `.env.${nodeEnv}.local`];

  for (const file of files) {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;
    try {
      process.loadEnvFile(fullPath);
    } catch (error) {
      console.warn(`[env] 无法加载 ${file}: ${(error as Error).message}`);
    }
  }
}

export function parseArgs(argv: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;

    const body = arg.slice(2);
    if (!body) continue;

    const equalsIndex = body.indexOf("=");
    if (equalsIndex >= 0) {
      const key = body.slice(0, equalsIndex).trim();
      if (key) result[key] = body.slice(equalsIndex + 1).trim();
      continue;
    }

    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith("--")) {
      result[body] = next;
      index += 1;
    } else {
      result[body] = true;
    }
  }
  return result;
}
