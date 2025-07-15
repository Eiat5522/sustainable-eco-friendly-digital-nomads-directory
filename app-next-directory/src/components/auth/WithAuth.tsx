"use client";

import { useSession } from '@auth/nextjs';
import { useRouter } from "next/navigation";
import { UserRole } from "@/types/auth";

interface WithAuthProps {
  requiredRoles?: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function WithAuth({
  requiredRoles,
  children,
  fallback = null,
}: WithAuthProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return fallback;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = session.user.role;
    if (!userRole || !requiredRoles.includes(userRole)) {
      router.push("/auth/unauthorized");
      return fallback;
    }
  }

  return <>{children}</>;
}
