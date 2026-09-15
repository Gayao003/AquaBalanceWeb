"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthChange, getUserProfile } from "@/lib/firestore";
import { User } from "firebase/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [checking, setChecking] = useState(!isLoginPage);

  useEffect(() => {
    const unsub = onAuthChange(async (user: User | null) => {
      if (isLoginPage) {
        setChecking(false);
        // If already logged in as admin, send straight to dashboard
        if (user) {
          try {
            const profile = await getUserProfile(user.uid);
            if (profile?.role === "admin") {
              router.replace("/admin/dashboard");
            }
          } catch (_) {}
        }
        return;
      }

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== "admin") {
          router.replace("/admin/login");
          return;
        }
        setChecking(false);
      } catch (err) {
        console.error("Auth verification error:", err);
        router.replace("/admin/login");
      }
    });

    return unsub;
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Verifying access…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
