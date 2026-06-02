import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTOTP } from "@/lib/totp";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await request.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, totpSecret: true, totpEnabled: true },
  });

  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "TOTP not configured" }, { status: 400 });
  }

  const isValid = verifyTOTP(user.totpSecret, code);
  if (!isValid) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  await prisma.otpSession.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ success: true, forceRefresh: true });
}
