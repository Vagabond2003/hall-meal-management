import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Ensure the user is fully logged in before checking active/approved states
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Role-based protection: Admin routes
    if (path.startsWith("/admin")) {
      if (token.role !== "admin") {
        return NextResponse.redirect(new URL("/student/meal-selection", req.url));
      }
    }

    // Role-based protection: Student routes
    if (path.startsWith("/student")) {
      if (token.role !== "student") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }

      // Check student statuses
      if (!token.is_active) {
        return NextResponse.redirect(new URL("/deactivated", req.url));
      }
      
      if (!token.is_approved) {
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Apply middleware to these specific paths
export const config = {
  matcher: ["/admin/:path*", "/student/:path*"],
};
