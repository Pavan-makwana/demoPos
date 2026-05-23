"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiShoppingCart,
  FiFileText,
  FiSettings,
  FiMenu,
  FiX,
  FiLogOut,
  FiCoffee,
} from "react-icons/fi";
import { MdOutlinePointOfSale } from "react-icons/md";
import { useAuth } from "../../../lib/AuthContext";
import { auth } from "../../../lib/firebase";
import { signOut } from "firebase/auth";

const navLinks = [
  { href: "/pos", icon: FiShoppingCart, label: "Billing", exact: true },
  {
    href: "/pos/history",
    icon: FiFileText,
    label: "Order Ledger",
    exact: false,
  },
  {
    href: "/pos/shift",
    icon: MdOutlinePointOfSale,
    label: "Register",
    exact: false,
  },
];

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { tenantId } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      {/* ── Desktop Left Navigation Sidebar (Visible on md and larger) ── */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card shrink-0 z-50">
        {/* Brand Logo */}
        <div className="flex h-16 items-center justify-center border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <FiCoffee size={18} />
            </div>
            <span className="text-base font-black tracking-tight text-foreground">
              Ladoo
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
          {navLinks.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={getHref(href)}
                className={`group flex items-center gap-3 rounded-xl p-3 font-semibold transition-all ${
                  active
                    ? "bg-primary/10 border border-primary/20 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="text-sm">{label}</span>
              </Link>
            );
          })}

          {/* Bottom Actions */}
          <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-border/50">
            <Link
              href={getHref("/pos/settings")}
              className={`group flex items-center gap-3 rounded-xl p-3 font-semibold transition-all ${
                pathname === getHref("/pos/settings")
                  ? "bg-primary/10 border border-primary/20 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              }`}
            >
              <FiSettings size={18} className="shrink-0" />
              <span className="text-sm">Settings</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="group flex w-full items-center gap-3 rounded-xl p-3 font-semibold text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600 border border-transparent outline-none cursor-pointer"
            >
              <FiLogOut size={18} className="shrink-0" />
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <FiCoffee size={18} />
            </div>
            <span className="text-base font-black tracking-tight text-foreground">
              Ladoo
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground hover:opacity-90 active:scale-95 transition-all outline-none"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <FiCoffee size={18} />
                  </div>
                  <span className="text-base font-black tracking-tight text-foreground">
                    Ladoo
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
              <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
                {navLinks.map(({ href, icon: Icon, label, exact }) => {
                  const active = isActive(href, exact);
                  return (
                    <Link
                      key={href}
                      href={getHref(href)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl p-3 font-semibold transition-all ${
                        active
                          ? "bg-primary/10 border border-primary/20 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="text-sm">{label}</span>
                    </Link>
                  );
                })}

                {/* Bottom Actions */}
                <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-border/50">
                  <Link
                    href={getHref("/pos/settings")}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl p-3 font-semibold transition-all ${
                      pathname === getHref("/pos/settings")
                        ? "bg-primary/10 border border-primary/20 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                    }`}
                  >
                    <FiSettings size={18} className="shrink-0" />
                    <span className="text-sm">Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl p-3 font-semibold text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600 border border-transparent outline-none cursor-pointer"
                  >
                    <FiLogOut size={18} className="shrink-0" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
