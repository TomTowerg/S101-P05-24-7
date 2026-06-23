import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { name, email, message } = parsed.data;

  const concierges = await prisma.user.findMany({
    where: { role: "CONSERJE" },
    include: { pushSubscriptions: true },
  });

  const notificationTitle = "Nuevo residente necesita apartamento";
  const notificationMessage = `${name} (${email}): ${message}`;

  // Always create in-app Notification for every concierge
  await Promise.all(
    concierges.map((c) =>
      prisma.notification.create({
        data: {
          userId: c.id,
          title: notificationTitle,
          message: notificationMessage,
        },
      })
    )
  );

  // Attempt push notifications (best-effort)
  const hasSubs = concierges.some((c) => c.pushSubscriptions.length > 0);

  if (hasSubs) {
    const pushPayload = JSON.stringify({
      title: notificationTitle,
      body: notificationMessage,
      url: "/dashboard/conserje",
    });

    const webpush = (await import("@/lib/webpush")).default;

    const pushPromises = concierges.flatMap((concierge) =>
      concierge.pushSubscriptions.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            pushPayload
          )
          .catch((err) => {
            console.error(`Push error to concierge ${concierge.email}:`, err);
            if (err.statusCode === 404 || err.statusCode === 410) {
              return prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          })
      )
    );

    Promise.all(pushPromises); // fire and forget
  }

  return NextResponse.json({
    ok: true,
    pushed: hasSubs,
    ...(hasSubs ? {} : { reason: "no_subscriptions" }),
  });
}
