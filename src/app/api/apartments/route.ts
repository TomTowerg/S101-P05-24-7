import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  number: z.string().min(1, "Número requerido").max(10),
  tower: z.string().max(10).optional().nullable(),
  floor: z.string().max(10).optional().nullable(),
});

async function requireConcierge() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  if (session.user.role !== "CONSERJE") return null;
  return session;
}

// GET /api/apartments — list apartments (public endpoint)
// CONSERJE: full data including resident names and emails
// RESIDENTE or unauthenticated: apartment identifiers only (no PII)
export async function GET() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "CONSERJE") {
    const apartments = await prisma.apartment.findMany({
      orderBy: [{ tower: "asc" }, { number: "asc" }],
      include: {
        residents: {
          where: { role: "RESIDENTE", onboardingComplete: true },
          select: { id: true, name: true, email: true },
        },
        _count: { select: { packages: true } },
      },
    });
    return NextResponse.json(apartments);
  }

  // RESIDENTE or unauthenticated: minimal data only — no resident PII
  const apartments = await prisma.apartment.findMany({
    orderBy: [{ tower: "asc" }, { number: "asc" }],
    select: { id: true, number: true, tower: true },
  });
  return NextResponse.json(apartments);
}

// POST /api/apartments — create apartment (conserje only)
export async function POST(request: NextRequest) {
  const session = await requireConcierge();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { number, tower, floor } = parsed.data;

  // @@unique([number, tower]) constraint — catch duplicates gracefully
  const existing = await prisma.apartment.findUnique({
    where: { number_tower: { number, tower: tower ?? "" } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "APARTMENT_EXISTS" },
      { status: 409 }
    );
  }

  const apartment = await prisma.apartment.create({
    data: { number, tower: tower || null, floor: floor || null },
  });

  return NextResponse.json(apartment, { status: 201 });
}
