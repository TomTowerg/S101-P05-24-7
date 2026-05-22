import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const apartmentId = searchParams.get('apartmentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');

    let whereClause: any = {};

    // If resident, only show packages for their apartment
    if (token.role === "RESIDENTE") {
      // We need to fetch the user's apartmentId from the DB
      const user = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { apartmentId: true }
      });

      if (!user?.apartmentId) {
        return NextResponse.json([]); // No packages if no apartment assigned
      }

      whereClause.apartmentId = user.apartmentId;
    } else {
      // Concierge can filter by apartmentId
      if (apartmentId) {
        whereClause.apartmentId = apartmentId;
      }
    }

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      if (type === 'perishable') {
        whereClause.isPerishable = true;
      } else if (type === 'standard') {
        whereClause.isPerishable = false;
      }
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    if (search) {
      whereClause.OR = [
        { trackingCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { receiverName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const packages = await prisma.package.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        apartment: true,
      },
      take: 50,
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
