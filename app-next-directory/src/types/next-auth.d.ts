import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as NextAuthJWT } from "@auth/core/jwt";

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {
    id: string;
    role?: UserRole;
    refreshTokenHash?: string;
    createdAt?: number;
    email?: string;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: UserRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: UserRole;
  }
}