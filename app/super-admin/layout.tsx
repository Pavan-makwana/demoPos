"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiLogOut, FiShield, FiLoader, FiUsers } from "react-icons/fi";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user || role !== "super_admin") {
        router.push("/login");
      }
    }
  }, [user, role, loading, mounted, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading || !mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <FiLoader className="animate-spin text-3xl text-primary" />
      </div>
    );
  }

  if (!user || role !== "super_admin") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <FiLoader className="animate-spin text-3xl text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-['DM_Sans',sans-serif]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card shadow-sm z-50 shrink-0">
        <div className="flex h-20 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-md shadow-rose-600/20">
              <FiShield size={18} />
            </div>
            <span className="text-lg font-black tracking-tight text-foreground">
              Super<span className="text-rose-600">Admin</span>
            </span>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-4">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            SaaS Management
          </p>
          <Link
            href="/super-admin"
            className="group flex items-center gap-3 rounded-xl p-3 font-semibold transition-all bg-rose-500/10 border border-rose-500/20 text-rose-600 shadow-sm"
          >
            <FiUsers size={20} className="shrink-0" />
            <span className="text-sm">Tenants List</span>
          </Link>

          <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-border">
            <button
              onClick={handleSignOut}
              className="group flex w-full items-center gap-3 rounded-xl p-3 font-semibold text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600 outline-none cursor-pointer"
            >
              <FiLogOut size={20} className="shrink-0" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Mobile Navbar */}
        <header className="flex md:hidden h-16 items-center justify-between border-b border-border bg-card px-4 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-md shadow-rose-600/20">
              <FiShield size={18} />
            </div>
            <span className="text-lg font-black tracking-tight text-foreground">
              Super<span className="text-rose-600">Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all outline-none"
              aria-label="Sign Out"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-y-auto relative bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
