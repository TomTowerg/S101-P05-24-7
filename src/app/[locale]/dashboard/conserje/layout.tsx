"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  PackageSearch,
  BarChart3,
  AlertCircle,
  LogOut,
  Package,
  Search,
} from "lucide-react";
import { ReactNode } from "react";

export default function ConciergeLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const t = useTranslations("Concierge");
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/conserje", icon: LayoutDashboard, label: t("navResumen") },
    { href: "/dashboard/conserje/packages", icon: PackageSearch, label: t("navPaquetes") },
    { href: "/dashboard/conserje/reports", icon: BarChart3, label: t("navReportes") },
    { href: "/dashboard/conserje/claims", icon: AlertCircle, label: t("navReclamos") }
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard/conserje") {
      return pathname.endsWith("/dashboard/conserje");
    }
    return pathname.includes(path);
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col md:flex-row transition-theme pt-16">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-[240px] shrink-0 bg-[#141414] border-r border-white/[0.08] flex-col h-[calc(100vh-4rem)] sticky top-16">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-[#6366F1]" />
            <span className="font-bold text-sm tracking-[0.12em] text-white uppercase">LOOMBOX</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-[#262626] rounded-xl px-3 py-2 border border-white/[0.08]">
            <Search className="w-3.5 h-3.5 text-[#606060] shrink-0" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent text-[13px] text-white placeholder:text-[#606060] outline-none w-full"
            />
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] transition-colors cursor-pointer ${
                  active
                    ? "text-[#6366F1] bg-[#6366F1]/[0.08] font-medium"
                    : "text-[#A0A0A0] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="mt-auto border-t border-white/[0.08] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#6366F1]/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-[#6366F1]">
                {session?.user?.name?.charAt(0) ?? "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{session?.user?.name}</p>
              <p className="text-[11px] text-[#606060] truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
              className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#606060] hover:text-white transition-colors cursor-pointer"
              aria-label={t("signOut")}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-[#141414] overflow-auto min-h-screen">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label={t("mobileNavAriaLabel")}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-white/[0.08] flex justify-around p-2 z-50"
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                active ? "text-[#6366F1]" : "text-[#606060]"
              }`}
            >
              <item.icon className="w-5 h-5 mb-1" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
