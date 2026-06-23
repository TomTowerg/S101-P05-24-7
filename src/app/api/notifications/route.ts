import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json([]);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    take: 20,
  });

  return NextResponse.json(notifications);
}
