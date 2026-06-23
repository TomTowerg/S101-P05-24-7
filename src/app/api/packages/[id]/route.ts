import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        apartment: true,
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // IDOR guard: residents can only access packages for their own apartment
    if (token.role === "RESIDENTE") {
      const user = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { apartmentId: true },
      });
      if (!user?.apartmentId || user.apartmentId !== pkg.apartmentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(pkg);
  } catch (error) {
    console.error("Error fetching package:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
