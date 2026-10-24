import { NextResponse, type NextRequest } from "next/server";
import { normalizeAdminPath } from "@/lib/route-path";

const adminPath = normalizeAdminPath(process.env.ADMIN_PATH);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // When a custom admin path is configured the canonical `/admin` route stays
  // unreachable, so that the configured entry point is the only one exposed.
  if (adminPath !== "/admin" && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex" },
    });
  }

  const response = NextResponse.next();

  if (
    pathname === adminPath ||
    pathname.startsWith(`${adminPath}/`) ||
    pathname.startsWith("/api/")
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

/**
 * Next.js requires a statically analysable matcher. The canonical `/admin`
 * routes are always matched so that a custom ADMIN_PATH can hide them; the
 * custom path itself is rewritten to `/admin` by next.config.ts.
 */
export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/:path*"],
};
