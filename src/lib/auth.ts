import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { loginSchema } from "@/lib/validations/auth";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
} from "@/lib/rate-limit";

/**
 * Central NextAuth configuration.
 * Exported here so it can be shared between:
 *  - src/app/api/auth/[...nextauth]/route.ts (handler)
 *  - src/app/api/auth/set-role/route.ts      (getServerSession)
 */
export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,

  // Use JWT strategy so middleware (proxy.ts) can read the token at the edge
  session: { strategy: "jwt" },

  providers: [
    // ── SSO: Google OAuth 2.0 ────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    // ── OTP: Email Magic Link ────────────────────────────────────────────────
    EmailProvider({
      server: process.env.EMAIL_SERVER || "",
      from: process.env.EMAIL_FROM || "noreply@loombox.cl",
      maxAge: 60 * 10,
    }),

    // ── Email + Password ─────────────────────────────────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, role } = parsed.data;

        // Brute-force protection: 5 attempts → 15-min lockout
        const rateCheck = checkLoginRateLimit(email);
        if (rateCheck.locked) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        // Generic message — don't reveal whether the email exists
        if (!user || !user.password) {
          recordFailedLogin(email);
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          recordFailedLogin(email);
          return null;
        }

        clearLoginRateLimit(email);

        // Only set role on first login (when DB role is unset)
        if (!user.role) {
          await prisma.user.update({ where: { email }, data: { role } });
        }

        return { id: user.id, email: user.email!, name: user.name, role: user.role || role };
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ account }) {
      const allowed = ["google", "email", "credentials"];
      // account is null for credentials in some NextAuth builds — allow it
      return allowed.includes(account?.provider ?? "credentials");
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            role: true,
            apartment: true,
            onboardingComplete: true,
            totpEnabled: true,
            trustedDevices: {
              where: { expiresAt: { gt: new Date() } },
            },
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.apartment = dbUser.apartment;
          token.onboardingComplete = dbUser.onboardingComplete;
          token.totpEnabled = dbUser.totpEnabled;

          const cookieStore = await cookies();
          const trustedCookie = cookieStore.get("loombox_trusted_device")?.value;
          const isTrusted =
            !!trustedCookie &&
            dbUser.trustedDevices.some((td) => td.token === trustedCookie);

          const otpSession = await prisma.otpSession.findFirst({
            where: { userId: dbUser.id, expiresAt: { gt: new Date() } },
          });

          token.otpVerified = isTrusted || !!otpSession;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as import("@prisma/client").UserRole;
        (session.user as any).apartment = token.apartment;
        (session.user as any).onboardingComplete = token.onboardingComplete;
        (session.user as any).otpVerified = token.otpVerified;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
