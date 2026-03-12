"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Guards the student layout against a race condition where the session is
 * still loading or the role hasn't been confirmed yet. Prevents the admin
 * layout from flashing during hard refresh by holding rendering until the
 * session is fully authenticated and confirmed as "student".
 */
export function StudentLayoutGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Once session is loaded, if the user is not a student, redirect immediately.
    if (status === "authenticated" && session?.user?.role !== "student") {
      router.replace("/admin/dashboard");
    }
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, session, router]);

  // While loading, render a minimal placeholder — no sidebar at all.
  // This prevents showing the wrong layout during hydration.
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  // If authenticated as student, render children normally.
  if (status === "authenticated" && session?.user?.role === "student") {
    return <>{children}</>;
  }

  // For any other state (unauthenticated or wrong role), render nothing
  // — the useEffect redirect will handle it.
  return null;
}
