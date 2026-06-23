import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { verifyOTP } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, trustDevice } = await req.json();

    if (!code || typeof code !== 'string') {
       return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
    }

    const result = await verifyOTP(session.user.email, code);

    if (result.success) {
      // 1. Mark verified transiently via an ephemeral OtpSession
      await prisma.otpSession.create({
        data: {
          userId: session.user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        }
      });

      // 2. Handle Trusted Device 30-day token
      let setCookieHeader = null;
      if (trustDevice) {
         const deviceToken = crypto.randomBytes(32).toString('hex');
         const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

         await prisma.trustedDevice.create({
           data: {
             userId: session.user.id, // Exposed in auth.ts
             token: deviceToken,
             expiresAt: expires
           }
         });

         // Max-Age in seconds
         setCookieHeader = `loombox_trusted_device=${deviceToken}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${30 * 24 * 60 * 60}`;
      }

      const response = NextResponse.json({ success: true });
      if (setCookieHeader) {
         response.headers.set('Set-Cookie', setCookieHeader);
      }

      return response;
    } else {
      return NextResponse.json({ 
        error: result.error, 
        attemptsLeft: result.attemptsLeft,
        lockoutUntil: result.lockoutUntil
      }, { status: 400 });
    }

  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
