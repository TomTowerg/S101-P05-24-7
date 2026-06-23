import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Only CONSERJE can mark as delivered
  if (!token || token.role !== "CONSERJE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { receiverName?: string } = {};
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { receiverName } = body;

  if (!receiverName || receiverName.trim() === "") {
    return NextResponse.json({ error: "Receiver name is required" }, { status: 400 });
  }

  try {
    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        status: "DELIVERED",
        pickedUpAt: new Date(),
        receiverName: receiverName.trim(),
        pickedUpById: token.id as string,
        events: {
          create: {
            type: "PICKED_UP",
            notes: `Entregado a: ${receiverName.trim()}`,
            createdById: token.id as string,
          },
        },
      },
    });

    // Notify residents of the apartment that the package was picked up
    const residents = await prisma.user.findMany({
      where: { apartmentId: updatedPackage.apartmentId },
      include: { pushSubscriptions: true },
    });

    if (residents.length > 0) {
      const notificationMsg = `El paquete ${updatedPackage.trackingCode} fue retirado por ${receiverName.trim()}.`;

      await prisma.notification.createMany({
        data: residents.map((r) => ({
          userId: r.id,
          title: "Encomienda retirada",
          message: notificationMsg,
        })),
      });

      const webpush = (await import("@/lib/webpush")).default;
      const pushPayload = JSON.stringify({
        title: "Encomienda retirada",
        body: notificationMsg,
        url: "/dashboard/resident",
      });

      const pushPromises = residents.flatMap((resident) =>
        resident.pushSubscriptions.map((sub) =>
          webpush
            .sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              pushPayload
            )
            .catch((err: any) => {
              if (err.statusCode === 404 || err.statusCode === 410) {
                return prisma.pushSubscription.delete({ where: { id: sub.id } });
              }
            })
        )
      );
      Promise.all(pushPromises);
    }

    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error("Error updating package status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
