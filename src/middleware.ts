import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Allow access to sign-in page and NextAuth API routes only
    if (
      pathname.startsWith("/auth") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/health")
    ) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users to sign-in
    if (!token) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }

    // Role-based route protection
    const role = token.role;

    // Admin routes
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Teacher routes
    if (pathname.startsWith("/teacher") && role !== "TEACHER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Principal routes
    if (pathname.startsWith("/principal") && role !== "PRINCIPAL") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow access to public pages and NextAuth API only
        if (
          pathname === "/" ||
          pathname.startsWith("/auth") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/health")
        ) {
          return true;
        }

        // Require authentication for all other pages
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|public).*)"],
};
