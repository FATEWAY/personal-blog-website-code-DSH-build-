import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";
import { findSession } from "@/lib/db/sessions";
import { adminHref } from "@/lib/route-path";
import type { AuthSession } from "@/lib/types";

/** Reads the session cookie and resolves it against the database. */
export async function getCurrentSession(): Promise<AuthSession | null> {
  const store = await cookies();
  const token = store.get(config.sessionCookieName)?.value;
  if (!token) return null;
  return findSession(token);
}

/** Server-component guard: redirects anonymous visitors to the login page. */
export async function requireAdminPage(): Promise<AuthSession> {
  const session = await getCurrentSession();
  if (!session) {
    redirect(adminHref(config.adminPath, "login"));
  }
  return session;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: config.secureCookies,
    path: "/",
    maxAge: config.sessionTtlHours * 60 * 60,
  };
}
