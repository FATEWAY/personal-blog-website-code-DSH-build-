import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { findSession } from "@/lib/db/sessions";
import { AppError, ForbiddenError, RateLimitError, UnauthorizedError } from "@/lib/errors";
import type { AuthSession } from "@/lib/types";
import { ValidationError } from "@/lib/validation";

export function getClientIp(request: NextRequest): string {
  if (config.trustProxy) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first.slice(0, 64);
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim().slice(0, 64);
  }
  return "unknown";
}

export function getSessionToken(request: NextRequest): string | null {
  return request.cookies.get(config.sessionCookieName)?.value ?? null;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthSession> {
  const token = getSessionToken(request);
  if (!token) throw new UnauthorizedError();
  const session = findSession(token);
  if (!session) throw new UnauthorizedError("登录状态已失效，请重新登录");
  return session;
}

/**
 * Rejects cross-site mutations. Browsers always send Origin for fetch/POST,
 * so a mismatching host is a strong CSRF signal in addition to the header
 * token checked in assertCsrf.
 */
export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") {
    if (origin === "null") throw new ForbiddenError("请求来源不受信任");
    return;
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ForbiddenError("请求来源不受信任");
  }

  const requestHost = request.headers.get("host");
  const siteHost = new URL(config.siteUrl).host;
  if (originHost !== requestHost && originHost !== siteHost) {
    throw new ForbiddenError("请求来源不受信任");
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

export function assertCsrf(request: NextRequest, auth: AuthSession): void {
  const token = request.headers.get("x-csrf-token") ?? "";
  if (!safeEqual(token, auth.session.csrfToken)) {
    throw new ForbiddenError("安全校验失败，请刷新页面后重试");
  }
}

/**
 * Guard for every admin API route: same-origin check, session lookup and a
 * session-bound CSRF token for mutations.
 */
export async function requireAdminApi(request: NextRequest): Promise<AuthSession> {
  assertSameOrigin(request);
  const auth = await authenticateRequest(request);
  if (request.method !== "GET" && request.method !== "HEAD") {
    assertCsrf(request, auth);
  }
  return auth;
}

export async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError(400, "请求内容格式不正确", "INVALID_JSON");
  }
}

export function json(data: unknown, status = 200, headers?: Record<string, string>): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return json(
      {
        error: {
          message: "请检查表单中的错误",
          code: "VALIDATION_ERROR",
          fields: error.errors,
        },
      },
      422,
    );
  }

  if (error instanceof RateLimitError) {
    return json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      },
      429,
      { "Retry-After": String(error.retryAfterSeconds) },
    );
  }

  if (error instanceof AppError) {
    return json(
      {
        error: {
          message: error.message,
          code: error.code,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      error.status,
    );
  }

  // Never expose stack traces, paths or SQL errors to clients.
  console.error("[api] Unhandled error:", error);
  return json(
    { error: { message: "服务器处理请求时出现问题，请稍后重试", code: "INTERNAL_ERROR" } },
    500,
  );
}

/** Wraps an async route handler with centralised error serialisation. */
export async function handleRoute(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    return errorResponse(error);
  }
}
