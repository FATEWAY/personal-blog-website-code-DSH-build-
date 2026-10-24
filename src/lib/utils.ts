export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Produces an ASCII slug. Chinese titles intentionally produce an empty string
 * here; callers fall back to a stable generated slug and the editor lets the
 * author replace it with a readable English one.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function fallbackSlug(prefix = "post", date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${stamp}-${suffix}`;
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length >= 2 && value.length <= 80;
}

export function calculateReadingMinutes(content: string): number {
  if (!content.trim()) return 1;
  const withoutCode = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ");

  const cjkCount = (withoutCode.match(/[\u3400-\u9fff\uf900-\ufaff]/g) ?? []).length;
  const latinText = withoutCode.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ");
  const wordCount = (latinText.match(/[A-Za-z0-9_]+/g) ?? []).length;

  return Math.max(1, Math.ceil(cjkCount / 300 + wordCount / 200));
}

export function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Only same-origin relative paths such as /media/... are accepted for images. */
export function isSafeImagePath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("..");
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "F";
  if (/^[\u3400-\u9fff]/.test(trimmed)) return trimmed.slice(0, 1);
  return trimmed.slice(0, 2).toUpperCase();
}

export function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
