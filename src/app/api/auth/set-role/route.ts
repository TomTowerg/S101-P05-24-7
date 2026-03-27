import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * GET /api/auth/set-role?role=CONSERJE&next=/dashboard
 *
 * Called as the OAuth callbackUrl after Google sign-in.
 * Reads the desired role from the query param and updates the
 * authenticated user's role in the database, then redirects to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get("role");
  const next = searchParams.get("next") ?? "/dashboard";

  // Validate role param
  const validRoles: UserRole[] = ["CONSERJE", "RESIDENTE"];
  const role: UserRole =
    roleParam && validRoles.includes(roleParam as UserRole)
      ? (roleParam as UserRole)
      : "RESIDENTE";

  // Get the current session (user must be logged in at this point)
  const session = await getServerSession();

  if (session?.user?.email) {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { role },
    });
  }

  // Redirect to the intended destination
  const redirectUrl = new URL(next, request.url);
  return NextResponse.redirect(redirectUrl);
}
