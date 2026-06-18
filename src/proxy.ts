import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const pathname = request.nextUrl.pathname;

  // Protect routes that require authentication
  const isAuthAPI = pathname.startsWith("/api/auth");
  const isVerifyTOTP = pathname.includes("/auth/verify-totp");
  const isSetupTOTP = pathname.includes("/auth/setup-totp");
  const isOnboarding = pathname.includes("/onboarding");
  const isDashboard = pathname.includes("/dashboard");

  if (isDashboard || isOnboarding || isVerifyTOTP || isSetupTOTP) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Onboarding redirection logic
    if (!token.onboardingComplete && !isOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // TOTP Verification redirection logic
    if (token.onboardingComplete && !token.otpVerified && !isVerifyTOTP && !isSetupTOTP && !isAuthAPI) {
      const totpEnabled = (token as any).totpEnabled;
      const dest = totpEnabled ? "/auth/verify-totp" : "/auth/setup-totp";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    if (token.onboardingComplete && token.otpVerified && (isOnboarding || isVerifyTOTP || isSetupTOTP)) {
      const dashboardPath = token.role === "CONSERJE" ? "/dashboard/conserje" : "/dashboard/resident";
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Role-based protection for dashboard routes
    if (pathname.includes("/dashboard/conserje")) {
      if (token.role !== "CONSERJE") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } else if (pathname.includes("/dashboard/resident")) {
      if (token.role !== "RESIDENTE") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  // Next-intl middleware for all matched paths
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/',
    '/(es|en)/:path*',
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
