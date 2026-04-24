import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = req.nextUrl;

  // Not authenticated → send to login with callback URL
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection
  if (pathname.startsWith("/admin")) {
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/student/meal-selection", req.url));
    }
  }

  // Student route protection
  if (pathname.startsWith("/student")) {
    if (token.role !== "student") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (!token.is_active) {
      return NextResponse.redirect(new URL("/deactivated", req.url));
    }

    if (!token.is_approved) {
      return NextResponse.redirect(new URL("/pending-approval", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*"],
};