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
  apartmentNumber: z
    .string()
    .min(1, "Apartment number is required")
    .max(20)
    .trim(),
  tower: z.string().max(20).trim().optional().or(z.literal("")),
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

  const { trackingCode, apartmentNumber, tower, description, isPerishable } = parsed.data;

  // ── 3. Upsert apartment (create if not exists) ────────────────────────────
  const apartment = await prisma.apartment.upsert({
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

  const pushPayload = JSON.stringify({
    title: isPerishable 
      ? "ATENCION: Paquete Urgente / Perecedero Recibido" 
      : "Nuevo paquete recibido",
    body: isPerishable
      ? `Se ha registrado un paquete perecedero o urgente con seguimiento ${trackingCode} para el departamento ${apartmentNumber}. Se requiere pronto retiro.`
      : `Se ha registrado un paquete con seguimiento ${trackingCode} para el departamento ${apartmentNumber}.`,
    url: "/dashboard/resident",
    icon: "/icons/icon-192x192.png", // Ensure this exists or use a generic one
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
            // Subscription expired or no longer valid, we should delete it
            return prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        })
    )
  );

  // We don't await all of them to not block the response, but we can fire and forget or use waitUntil if in Edge
  Promise.all(pushPromises).then(() => {
    if (pushPromises.length > 0) {
      prisma.package.update({
        where: { id: newPackage.id },
        data: { status: "NOTIFIED", notifiedAt: new Date() }
      }).catch(console.error);
    }
  });

  return NextResponse.json(
    {
      message: "Package registered successfully",
      package: newPackage,
      notifiedResidents: residents.length,
    },
    { status: 201 }
  );
}
