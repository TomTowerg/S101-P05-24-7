import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * GET /api/auth/set-role?role=CONSERJE&next=/dashboard
 *
 * Called as the OAuth callbackUrl after Google sign-in.
 * Reads the desired role from the query param and updates the
 * authenticated user's role in the database, then redirects to `next`.
 *
 * After updating the DB, this endpoint triggers a session update so
 * the JWT token picks up the new role without requiring a fresh login.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get("role");
  const next = searchParams.get("next") ?? "/dashboard";

  // Validate role param — default to RESIDENTE if invalid
  const validRoles: UserRole[] = ["CONSERJE", "RESIDENTE"];
  const role: UserRole =
    roleParam && validRoles.includes(roleParam as UserRole)
      ? (roleParam as UserRole)
      : "RESIDENTE";

  // Get the current session (user must be logged in via Google/Email at this point)
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });
    // Only assign role on first OAuth login (when DB role is unset)
    if (!dbUser?.role) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: { role },
      });
    }
  }

  // Validate next is a relative path to prevent open redirect
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const redirectUrl = new URL(safeNext, request.url);
  return NextResponse.redirect(redirectUrl);
}
