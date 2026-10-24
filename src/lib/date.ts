/**
 * Date helpers shared by server components and client components.
 * The blog targets a Chinese audience, so dates are displayed in UTC+8.
 * Shanghai has no daylight saving time, which keeps conversions predictable.
 */
export const DISPLAY_TIME_ZONE = "Asia/Shanghai";
const OFFSET_SUFFIX = "+08:00";

function parts(date: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

export function isValidDate(value: string | null | undefined): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

/** "2026 年 10 月 23 日" */
export function formatDate(iso: string | null | undefined): string {
  if (!isValidDate(iso)) return "—";
  const p = parts(new Date(iso as string));
  return `${p.year} 年 ${Number(p.month)} 月 ${Number(p.day)} 日`;
}

/** "2026.10.23" — compact editorial style. */
export function formatDateDot(iso: string | null | undefined): string {
  if (!isValidDate(iso)) return "—";
  const p = parts(new Date(iso as string));
  return `${p.year}.${p.month}.${p.day}`;
}

/** "2026.10.23 20:15" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!isValidDate(iso)) return "—";
  const p = parts(new Date(iso as string));
  return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;
}

/** Value for <input type="datetime-local"> in Beijing time. */
export function toDateTimeLocalValue(iso: string | null | undefined): string {
  if (!isValidDate(iso)) return "";
  const p = parts(new Date(iso as string));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Parses a datetime-local value as Beijing time and returns an ISO UTC string. */
export function fromDateTimeLocalValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) return null;
  const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  const date = new Date(`${withSeconds}${OFFSET_SUFFIX}`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** ISO year used by the footer copyright. */
export function currentYear(): number {
  return Number(parts(new Date()).year);
}

export function formatRelativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!isValidDate(iso)) return "—";
  const diff = now - new Date(iso as string).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} 天前`;
  return formatDateDot(iso);
}
