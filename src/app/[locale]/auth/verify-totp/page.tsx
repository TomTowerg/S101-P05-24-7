import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import VerifyTOTPClient from "./VerifyTOTPClient";

export const dynamic = "force-dynamic";

export default async function VerifyTOTPPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  return <VerifyTOTPClient email={session.user.email} role={session.user.role} />;
}
