import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes (but allow the login page + login API)
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isLoginRoute = pathname.startsWith("/admin/login") || pathname.startsWith("/api/admin/login");

  if (!isAdminRoute || isLoginRoute) {
    return NextResponse.next();
  }

  const authed = req.cookies.get("admin-auth")?.value === "true";

  if (!authed) {
    // Browser pages: redirect to admin login
    if (pathname.startsWith("/admin")) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    // API routes: return 401 JSON
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

// Match both page routes + API routes for admin
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
