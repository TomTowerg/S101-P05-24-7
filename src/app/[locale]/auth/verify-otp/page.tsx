import VerifyOTPClient from "./VerifyOTPClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function VerifyOTPPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  return <VerifyOTPClient email={session.user.email} role={session.user.role} />;
}
