import { type NextRequest } from "next/server";
import {
  assertSameOrigin,
  errorResponse,
  getClientIp,
  json,
  readJsonBody,
} from "@/lib/api";
import { config } from "@/lib/config";
import { sessionCookieOptions } from "@/lib/auth/current";
import { getDummyHash, verifyPassword } from "@/lib/auth/password";
import {
  checkLoginThrottle,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/auth/rate-limit";
import { findAdminByUsername, recordAdminLogin } from "@/lib/db/admins";
import { cleanupExpiredSessions, createSession } from "@/lib/db/sessions";
import { AppError, RateLimitError } from "@/lib/errors";
import { parseLoginInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);

    const ip = getClientIp(request);
    const body = await readJsonBody(request);
    const { username, password } = parseLoginInput(body);

    const throttle = checkLoginThrottle(username, ip);
    if (!throttle.allowed) {
      throw new RateLimitError(
        `登录尝试过于频繁，请在 ${throttle.retryAfterSeconds} 秒后重试`,
        throttle.retryAfterSeconds,
      );
    }

    const admin = findAdminByUsername(username);
    const storedHash = admin?.password_hash ?? (await getDummyHash());
    const valid = await verifyPassword(password, storedHash);

    if (!admin || !valid || admin.disabled === 1) {
      recordLoginFailure(username, ip);
      throw new AppError(401, "用户名或密码错误", "INVALID_CREDENTIALS");
    }

    recordLoginSuccess(username, ip);
    recordAdminLogin(admin.id);
    cleanupExpiredSessions();

    const { token } = createSession(admin.id, {
      ttlHours: config.sessionTtlHours,
      ip,
      userAgent: request.headers.get("user-agent") ?? "",
    });

    const response = json({ ok: true });
    response.cookies.set(config.sessionCookieName, token, sessionCookieOptions());
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
