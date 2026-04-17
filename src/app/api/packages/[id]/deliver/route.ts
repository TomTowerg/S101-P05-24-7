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

  let body: { receiverName?: string } = {};
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { receiverName } = body;

  if (!receiverName || receiverName.trim() === "") {
    return NextResponse.json({ error: "Receiver name is required" }, { status: 400 });
  }

  try {
    // We use a transaction or nested writes
    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        status: "DELIVERED",
        pickedUpAt: new Date(),
        receiverName: receiverName.trim(),
        events: {
          create: {
            type: "PICKED_UP",
            notes: `Entregado a: ${receiverName.trim()}`,
            createdById: token.id as string,
          }
        }
      },
    });

    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error("Error updating package status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
