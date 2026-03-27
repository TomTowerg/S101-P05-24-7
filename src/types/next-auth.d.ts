import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

// Extend the AdapterUser to include role so @auth/prisma-adapter and next-auth v4 are compatible
declare module "next-auth/adapters" {
  interface AdapterUser {
    role: UserRole;
  }
}
