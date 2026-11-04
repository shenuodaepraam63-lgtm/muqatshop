import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight edge gate for /admin UI paths.
 * NOT a substitute for requireAdmin on API routes or RLS.
 * Cookie presence is a coarse signal only; APIs re-validate JWT + admin role.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Supabase auth cookies vary by project ref; presence of any sb-*-auth-token is a soft hint.
    const hasSessionCookie = request.cookies
      .getAll()
      .some(
        (c) =>
          c.name.includes("-auth-token") ||
          c.name.startsWith("sb-") && c.name.includes("auth")
      );

    if (!hasSessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
