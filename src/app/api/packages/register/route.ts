import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── Input validation schema ───────────────────────────────────────────────────
const registerPackageSchema = z.object({
  trackingCode: z
    .string()
    .min(3, "Tracking code must be at least 3 characters")
    .max(100)
    .trim(),
  apartmentNumber: z.string().max(20).trim().optional().or(z.literal("")),
  tower: z.string().max(20).trim().optional().or(z.literal("")),
  apartmentId: z.string().optional(),
  description: z.string().max(500).trim().optional().or(z.literal("")),
  isPerishable: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  // ── 1. Auth: only CONSERJE can register packages ──────────────────────────
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (token.role !== "CONSERJE") {
    return NextResponse.json(
      { error: "Forbidden: only concierges can register packages" },
      { status: 403 }
    );
  }

  // ── 2. Parse and validate body ────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registerPackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { trackingCode, apartmentNumber, tower, apartmentId, description, isPerishable } = parsed.data;

  // ── 3. Resolve apartment ──────────────────────────────────────────────────
  let apartment;
  if (apartmentId) {
    // Direct ID lookup — used by the new SELECT-based form
    apartment = await prisma.apartment.findUnique({ where: { id: apartmentId } });
    if (!apartment) {
      return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
    }
  } else {
    // Legacy: upsert by number+tower (backward compat)
    if (!apartmentNumber) {
      return NextResponse.json(
        { error: "apartmentNumber or apartmentId required" },
        { status: 422 }
      );
    }
    apartment = await prisma.apartment.upsert({
      where: {
        number_tower: {
          number: apartmentNumber,
          tower: tower ?? "",
        },
      },
      update: {},
      create: {
        number: apartmentNumber,
        tower: tower ?? "",
      },
    });
  }

  // ── 4. Check for duplicate tracking code ─────────────────────────────────
  const existing = await prisma.package.findUnique({ where: { trackingCode } });
  if (existing) {
    return NextResponse.json(
      { error: "A package with this tracking code already exists" },
      { status: 409 }
    );
  }

  // ── 5. Create the package ─────────────────────────────────────────────────
  const newPackage = await prisma.package.create({
    data: {
      trackingCode,
      description: description || null,
      isPerishable,
      status: "PENDING",
      apartmentId: apartment.id,
      registeredById: token.id as string,
    },
    include: {
      apartment: true,
      registeredBy: { select: { name: true, email: true } },
    },
  });

  // ── 6. Push Notification to Residents ─────────────────────────────────────
  // Lazy import webpush to avoid initialization errors during build time
  const webpush = (await import("@/lib/webpush")).default;

  // Find residents of this apartment with active push subscriptions
  const residents = await prisma.user.findMany({
    where: { apartmentId: apartment.id },
    include: { pushSubscriptions: true },
  });

  const hasPushSubscriptions = residents.some((r) => r.pushSubscriptions.length > 0);

  // Update status synchronously before fire-and-forget so Vercel can't tear down the fn before it runs
  if (hasPushSubscriptions) {
    await prisma.package.update({
      where: { id: newPackage.id },
      data: { status: "NOTIFIED", notifiedAt: new Date() },
    });
  }

  const pushPayload = JSON.stringify({
    title: isPerishable
      ? "ATENCION: Paquete Urgente / Perecedero Recibido"
      : "Nuevo paquete recibido",
    body: isPerishable
      ? `Se ha registrado un paquete perecedero o urgente con seguimiento ${trackingCode} para el departamento ${apartment.number}. Se requiere pronto retiro.`
      : `Se ha registrado un paquete con seguimiento ${trackingCode} para el departamento ${apartment.number}.`,
    url: "/dashboard/resident",
  });

  const pushPromises = residents.flatMap((resident) =>
    resident.pushSubscriptions.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          pushPayload
        )
        .catch((err) => {
          console.error(`Error sending push to ${resident.email}:`, err);
          if (err.statusCode === 404 || err.statusCode === 410) {
            return prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        })
    )
  );

  // Fire-and-forget: best effort, does not block the response
  Promise.all(pushPromises);

  return NextResponse.json(
    {
      message: "Package registered successfully",
      package: newPackage,
      notifiedResidents: residents.length,
    },
    { status: 201 }
  );
}
