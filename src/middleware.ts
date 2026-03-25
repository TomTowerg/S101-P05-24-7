import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const middleware = withAuth(
  function middleware(request: NextRequest) {
    const token = request.nextauth.token;
    const pathname = request.nextUrl.pathname;

    // If user is trying to access dashboard
    if (pathname.startsWith("/dashboard")) {
      // Check if user has the correct role for the requested dashboard
      if (pathname.startsWith("/dashboard/conserje")) {
        if (token?.role !== "CONSERJE") {
          return NextResponse.redirect(new URL("/login", request.url));
        }
      } else if (pathname.startsWith("/dashboard/resident")) {
        if (token?.role !== "RESIDENTE") {
          return NextResponse.redirect(new URL("/login", request.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/protected/:path*",
    // Add other protected routes here
  ],
};
