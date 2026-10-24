import { type NextRequest } from "next/server";
import { getSessionToken, json } from "@/lib/api";
import { findSession } from "@/lib/db/sessions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const token = getSessionToken(request);
    const auth = token ? findSession(token) : null;

    if (!auth) {
      return json({ authenticated: false, admin: null, csrfToken: null });
    }

    return json({
      authenticated: true,
      admin: auth.admin,
      csrfToken: auth.session.csrfToken,
      expiresAt: auth.session.expiresAt,
    });
  } catch (error) {
    console.error("[session] failed", error);
    return json({ authenticated: false, admin: null, csrfToken: null });
  }
}
