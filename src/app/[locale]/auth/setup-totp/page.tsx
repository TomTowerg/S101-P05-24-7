import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SetupTOTPClient from "./SetupTOTPClient";

export const dynamic = "force-dynamic";

export default async function SetupTOTPPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  return <SetupTOTPClient email={session.user.email} role={session.user.role} />;
}
