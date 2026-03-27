import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const pathname = request.nextUrl.pathname;

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is trying to access dashboard, check role
  if (pathname.startsWith("/dashboard")) {
    if (pathname.startsWith("/dashboard/conserje")) {
      if (token.role !== "CONSERJE") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } else if (pathname.startsWith("/dashboard/resident")) {
      if (token.role !== "RESIDENTE") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/protected/:path*",
  ],
};
