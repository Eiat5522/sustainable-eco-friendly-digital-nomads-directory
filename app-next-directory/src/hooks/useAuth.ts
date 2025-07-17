"use client";

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { UserRole } from "@/types/auth";

export function useRequireAuth(requiredRoles?: UserRole[]) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const safePath = pathname ?? "/";

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(safePath)}`);
      return;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = session.user.role;
      if (
        !userRole ||
        typeof userRole !== 'string' ||
        userRole === null ||
        !requiredRoles.includes(userRole as UserRole)
      ) {
        router.push("/auth/unauthorized");
      }
    }
  }, [session, status, router, safePath, requiredRoles]);

  return { session, status };
}

export function useIsAuthorized(requiredRoles?: UserRole[]) {
  const { data: session } = useSession();

  if (!session) return false;

  if (!requiredRoles || requiredRoles.length === 0) return true;

  return requiredRoles.includes(session.user.role);
}

export function useRedirectIfAuthenticated(redirectTo: string = "/") {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (session) {
      router.push(redirectTo);
    }
  }, [session, status, router, redirectTo]);

  return { session, status };
}
