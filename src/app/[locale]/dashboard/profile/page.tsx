import ProfileClient from "./ProfileClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  // Fetch the full user to get their TOTP status securely
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { 
      id: true,
      name: true,
      email: true,
      role: true,
      totpEnabled: true,
      apartment: { select: { number: true, tower: true } }
    }
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileClient 
      user={{
        name: user.name || "",
        email: user.email || "",
        role: user.role,
        totpEnabled: user.totpEnabled,
        apartment: user.apartment
      }} 
    />
  );
}
