import { type NextRequest } from "next/server";
import { assertSameOrigin, getSessionToken, json } from "@/lib/api";
import { sessionCookieOptions } from "@/lib/auth/current";
import { config } from "@/lib/config";
import { deleteSession } from "@/lib/db/sessions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    const token = getSessionToken(request);
    if (token) deleteSession(token);

    const response = json({ ok: true });
    response.cookies.set(config.sessionCookieName, "", {
      ...sessionCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch {
    // Logout should always clear the cookie, even if the session was already invalid.
    const response = json({ ok: true });
    response.cookies.set(config.sessionCookieName, "", {
      ...sessionCookieOptions(),
      maxAge: 0,
    });
    return response;
  }
}
