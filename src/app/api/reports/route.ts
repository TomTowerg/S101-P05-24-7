import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CONSERJE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Calculate past 7 days breakdown
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const packages = await prisma.package.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    include: { apartment: true }
  });

  // 1. Line chart trend (Packages per day)
  const last7DaysMap = new Map();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last7DaysMap.set(dateStr, { date: dateStr, count: 0 });
  }

  // 2. Pie chart status distribution
  const statusCounts = { PENDING: 0, NOTIFIED: 0, DELIVERED: 0 };
  
  // 3. Most active tower
  const towerCounts: Record<string, number> = {};

  packages.forEach(pkg => {
    const dateStr = pkg.createdAt.toISOString().split('T')[0];
    if (last7DaysMap.has(dateStr)) {
       last7DaysMap.get(dateStr).count += 1;
    }
    
    if (pkg.status === "PENDING") statusCounts.PENDING++;
    if (pkg.status === "NOTIFIED") statusCounts.NOTIFIED++;
    if (pkg.status === "DELIVERED") statusCounts.DELIVERED++;

    const tower = pkg.apartment?.tower || "Sin Torre";
    towerCounts[tower] = (towerCounts[tower] || 0) + 1;
  });

  const mostActiveTower = Object.keys(towerCounts).reduce((a, b) => towerCounts[a] > towerCounts[b] ? a : b, "—");

  return NextResponse.json({
    trend: Array.from(last7DaysMap.values()).reverse(),
    distribution: [
      { name: "Pending", value: statusCounts.PENDING, fill: "#f59e0b" },
      { name: "Notified", value: statusCounts.NOTIFIED, fill: "#3b82f6" },
      { name: "Delivered", value: statusCounts.DELIVERED, fill: "#10b981" },
    ],
    summary: {
      totalProcessed: packages.length,
      mostActiveTower: towerCounts[mostActiveTower] ? mostActiveTower : "—"
    }
  });
}
