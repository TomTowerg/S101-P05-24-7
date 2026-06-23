import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createClaimSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters").max(1000).trim(),
  type: z.enum(["WRONG_PACKAGE", "DAMAGED", "MISSING", "OTHER"]),
  packageId: z.string().cuid().optional().or(z.literal("")).transform(v => v || undefined),
});

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = token.role === "CONSERJE" ? {} : { userId: token.id as string };

  const claims = await prisma.claim.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      package: { select: { trackingCode: true, apartment: { select: { number: true, tower: true } } } },
    },
  });

  return NextResponse.json(claims);
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = createClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { description, type, packageId } = parsed.data;

  if (packageId) {
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });
    // Residents can only file claims for packages in their own apartment
    if (token.role === "RESIDENTE") {
      const user = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { apartmentId: true },
      });
      if (!user?.apartmentId || user.apartmentId !== pkg.apartmentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  const claim = await prisma.claim.create({
    data: { description, type, packageId: packageId ?? null, userId: token.id as string },
    include: {
      user: { select: { name: true, email: true } },
      package: { select: { trackingCode: true, apartment: { select: { number: true, tower: true } } } },
    },
  });

  return NextResponse.json(claim, { status: 201 });
}
