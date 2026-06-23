import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTOTPSecret, generateQRCode, verifyTOTP } from "@/lib/totp";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { totpSecret: true, totpEnabled: true },
  });

  if (user?.totpEnabled && user.totpSecret) {
    return NextResponse.json({ alreadyEnabled: true });
  }

  const { secret, uri } = generateTOTPSecret(session.user.email);
  const qrCode = await generateQRCode(uri);

  await prisma.user.update({
    where: { email: session.user.email },
    data: { totpSecret: secret },
  });

  return NextResponse.json({ secret, qrCode });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await request.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { totpSecret: true },
  });

  if (!user?.totpSecret) {
    return NextResponse.json({ error: "No TOTP secret found" }, { status: 400 });
  }

  const isValid = verifyTOTP(user.totpSecret, code);
  if (!isValid) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { totpEnabled: true },
  });

  await prisma.otpSession.create({
    data: {
      userId: (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))!.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ success: true });
}
