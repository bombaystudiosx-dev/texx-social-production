"use client";

import { useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_PATHS = ["/login", "/signup"];

/**
 * Logged-out visitors only ever see auth/onboarding — every other route
 * redirects to /login. The full app (feed, profiles, messages, settings)
 * is never rendered for an unauthenticated visitor, not just hidden by nav.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublicPath) {
      router.replace("/login");
    }
  }, [loading, user, isPublicPath, router]);

  if (loading) return null;
  if (!user && !isPublicPath) return null;

  return <>{children}</>;
}
