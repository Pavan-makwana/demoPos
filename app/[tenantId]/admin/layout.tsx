"use client";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiPieChart,
  FiList,
  FiGrid,
  FiDollarSign,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiExternalLink,
  FiPercent,
  FiFileText,
  FiCoffee,
} from "react-icons/fi";
import { FiBox } from "react-icons/fi";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "../../../lib/AuthContext";
import { auth } from "../../../lib/firebase";
import { signOut } from "firebase/auth";

const adminLinks = [
  { href: "/admin", icon: FiPieChart, label: "Dashboard", exact: true },
  { href: "/admin/menu", icon: FiList, label: "Menu Manager", exact: false },
  { href: "/admin/floorplan", icon: FiGrid, label: "Floor Plan", exact: false },
  {
    href: "/admin/finance",
    icon: FiDollarSign,
    label: "Financials",
    exact: false,
  },
  { href: "/admin/inventory", icon: FiBox, label: "Inventory", exact: false },
  { href: "/admin/orderledger", icon: FiFileText, label: "Order Ledger", exact: false },
  { href: "/admin/taxes", icon: FiPercent, label: "GST & Taxes", exact: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { tenantId, features } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredLinks = adminLinks.filter((link) => {
    if (link.href === "/admin/inventory") {
      return features?.inventory !== false;
    }
    if (link.href === "/admin/finance") {
      return features?.analytics !== false;
    }
    if (link.href === "/admin/floorplan") {
      return features?.qrMenu !== false;
    }
    return true;
  });

  const currentTenantId = params?.tenantId || tenantId || "";

  const getHref = (href: string) => {
    return currentTenantId ? `/${currentTenantId}${href}` : href;
  };

  const isActive = (href: string, exact: boolean) => {
    const fullHref = getHref(href);
    return exact ? pathname === fullHref : pathname.startsWith(fullHref);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-['DM_Sans',sans-serif]">
      {/* ── Desktop Admin Sidebar (Visible on md and larger) ── */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card shadow-sm z-50 shrink-0">
        {/* Brand Logo */}
        <div className="flex h-20 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <FiCoffee size={18} />
            </div>
            <span className="text-lg font-black tracking-tight text-foreground">
              Admin<span className="text-primary">Panel</span>
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Management
          </p>
          {filteredLinks.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={getHref(href)}
                className={`group flex items-center gap-3 rounded-xl p-3 font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className="text-sm">{label}</span>
              </Link>
            );
          })}

          {/* Bottom Actions */}
          <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-border">
            <Link
              href={getHref("/admin/settings")}
              className={`group flex items-center gap-3 rounded-xl p-3 font-semibold transition-all ${
                pathname === getHref("/admin/settings")
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <FiSettings size={20} className="shrink-0" />
              <span className="text-sm">Settings</span>
            </Link>
            <Link
              href={getHref("/pos")}
              target="_blank"
              className="group flex items-center gap-3 rounded-xl p-3 font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <FiExternalLink size={20} className="shrink-0" />
              <span className="text-sm">Go to POS</span>
            </Link>
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

      {/* ── Main Content Area & Mobile View Wrapper ── */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Mobile Top Navbar (Visible only below md) */}
        <header className="flex md:hidden h-16 items-center justify-between border-b border-border bg-card px-4 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <FiCoffee size={18} />
            </div>
            <span className="text-lg font-black tracking-tight text-foreground">
              Admin<span className="text-primary">Panel</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground hover:opacity-90 active:scale-95 transition-all outline-none"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer / Backdrop Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden font-['DM_Sans',sans-serif]">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sliding Drawer */}
            <aside className="relative flex w-3/4 max-w-xs flex-col bg-card h-full shadow-2xl border-r border-border z-10 animate-slide-right">
              {/* Drawer Header */}
              <div className="flex h-16 items-center justify-between border-b border-border px-4 bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
                    <FiCoffee size={18} />
                  </div>
                  <span className="text-lg font-black tracking-tight text-foreground">
                    Admin<span className="text-primary">Panel</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-muted-foreground hover:text-foreground shadow-sm"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto">
                <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Management
                </p>
                {filteredLinks.map(({ href, icon: Icon, label, exact }) => {
                  const active = isActive(href, exact);
                  return (
                    <Link
                      key={href}
                      href={getHref(href)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl p-3 font-semibold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon size={20} className="shrink-0" />
                      <span className="text-sm">{label}</span>
                    </Link>
                  );
                })}

                {/* Bottom Actions */}
                <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-border">
                  <Link
                    href={getHref("/admin/settings")}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl p-3 font-semibold transition-all ${
                      pathname === getHref("/admin/settings")
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <FiSettings size={20} className="shrink-0" />
                    <span className="text-sm">Settings</span>
                  </Link>
                  <Link
                    href={getHref("/pos")}
                    target="_blank"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex items-center gap-3 rounded-xl p-3 font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  >
                    <FiExternalLink size={20} className="shrink-0" />
                    <span className="text-sm">Go to POS</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl p-3 font-semibold text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600 outline-none cursor-pointer"
                  >
                    <FiLogOut size={20} className="shrink-0" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </nav>
            </aside>
          </div>
        )}

        {/* Main Area Content */}
        <main className="flex flex-1 flex-col overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
