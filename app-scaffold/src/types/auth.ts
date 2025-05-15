// Auth types
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

export type UserRole = 'user' | 'venueOwner' | 'editor' | 'admin';

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: UserRole;
  }
}

// Extend the built-in JWT types
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}

// Define auth form types
export interface SignInFormValues {
  email: string;
  password: string;
}

export interface SignUpFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Define schema for user profile
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  role: UserRole;
  createdAt?: string;
}
