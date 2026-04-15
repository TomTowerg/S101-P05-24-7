import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Only CONSERJE can mark as delivered
  if (!token || token.role !== "CONSERJE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        status: "DELIVERED",
        // We could add a deliveredAt field if it exists in schema
      },
    });

    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error("Error updating package status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
