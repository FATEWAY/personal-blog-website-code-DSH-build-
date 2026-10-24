/**
 * Normalises the admin path so it can be shared by middleware, next.config and
 * the runtime config without importing Node-only modules.
 */
export function normalizeAdminPath(raw: string | undefined): string {
  const fallback = "/admin";
  let value = (raw ?? "").trim();

  if (!value) return fallback;
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\/+$/, "");

  // Only allow a safe, readable path segment structure.
  if (!/^\/[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(value)) return fallback;
  if (value.startsWith("/api") || value.startsWith("/_next")) return fallback;
  if (value === "/") return fallback;

  return value;
}

export function adminHref(basePath: string, subPath = ""): string {
  const base = basePath.replace(/\/+$/, "");
  if (!subPath || subPath === "/") return base || "/";
  return `${base}/${subPath.replace(/^\/+/, "")}`;
}
