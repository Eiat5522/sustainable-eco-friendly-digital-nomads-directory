import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: string; // Add role to user type
    } & DefaultSession["user"];
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id: string;
    role: string; // Add role to user type
  }
}

declare module "next-auth/jwt" {
  /**
   * The shape of the JWT, when using JSON Web Tokens for session handling.
   * You can extend it with custom properties to store more information.
   */
  interface JWT {
    id: string;
    role: string; // Add role to JWT type
  }
}
