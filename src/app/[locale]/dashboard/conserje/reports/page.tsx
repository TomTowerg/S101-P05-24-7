import ReportsClient from "./ReportsClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "CONSERJE") {
    redirect("/login");
  }

  return <ReportsClient />;
}
