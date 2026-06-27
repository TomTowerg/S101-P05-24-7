"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  LayoutDashboard, PackageSearch, BarChart3, AlertCircle,
  LogOut, ChevronRight, PanelLeftClose,
} from "lucide-react";
import { ReactNode } from "react";

export default function ConciergeLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const t = useTranslations("Concierge");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: "/dashboard/conserje",          icon: LayoutDashboard, label: t("navResumen") },
    { href: "/dashboard/conserje/packages", icon: PackageSearch,   label: t("navPaquetes") },
    { href: "/dashboard/conserje/reports",  icon: BarChart3,        label: t("navReportes") },
    { href: "/dashboard/conserje/claims",   icon: AlertCircle,      label: t("navReclamos") },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard/conserje") return pathname.endsWith("/dashboard/conserje");
    return pathname.includes(path);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "#080810" }}>

      {/* ── Sidebar desktop ─────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 shrink-0 overflow-hidden"
        style={{
          width: collapsed ? 60 : 220,
          background: "#09090F",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ── User row + toggle (una sola fila) ── */}
        <div
          className="flex items-center shrink-0 px-2 gap-2"
          style={{
            height: 56,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Avatar */}
          <div
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.22)" }}
          >
            <span className="text-[12px] font-bold" style={{ color: "#818CF8" }}>
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
          </div>

          {/* Name + role — se oculta al colapsar */}
          <div
            className="flex-1 min-w-0"
            style={{
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : 160,
              overflow: "hidden",
              transition: "opacity 130ms, max-width 220ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <p className="text-[13px] font-semibold text-white truncate leading-none whitespace-nowrap">
              {session?.user?.name}
            </p>
            <p className="text-[11px] truncate mt-0.5 leading-none whitespace-nowrap" style={{ color: "rgba(255,255,255,0.35)" }}>
              {t("conciergeRoleBadge")}
            </p>
          </div>

          {/* Toggle — siempre visible */}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-all cursor-pointer"
            style={{ color: "rgba(255,255,255,0.28)", marginLeft: collapsed ? "auto" : undefined }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.80)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <PanelLeftClose className="w-3.5 h-3.5" />
            }
          </button>
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as any}
                title={collapsed ? item.label : undefined}
                className="flex items-center rounded-xl h-9 transition-all duration-150 cursor-pointer overflow-hidden"
                style={{
                  padding: collapsed ? "0" : "0 10px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  color: active ? "#818CF8" : "rgba(255,255,255,0.45)",
                  background: active ? "rgba(99,102,241,0.10)" : "transparent",
                  border: active ? "1px solid rgba(99,102,241,0.16)" : "1px solid transparent",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span
                  className="text-[14px] font-medium whitespace-nowrap ml-3"
                  style={{
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? 0 : 160,
                    overflow: "hidden",
                    transition: "opacity 130ms, max-width 220ms cubic-bezier(0.4,0,0.2,1)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ── Sign out ── */}
        <div
          className="shrink-0 px-2 py-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
            title={collapsed ? t("signOut") : undefined}
            className="w-full flex items-center rounded-xl h-9 transition-all duration-150 cursor-pointer overflow-hidden"
            style={{
              padding: collapsed ? "0" : "0 10px",
              justifyContent: collapsed ? "center" : "flex-start",
              color: "rgba(255,255,255,0.38)",
              border: "1px solid transparent",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = "#F87171";
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
              (e.currentTarget as HTMLElement).style.border = "1px solid rgba(239,68,68,0.14)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.border = "1px solid transparent";
            }}
            aria-label={t("signOut")}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span
              className="text-[14px] font-medium whitespace-nowrap ml-3"
              style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 160,
                overflow: "hidden",
                transition: "opacity 130ms, max-width 220ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {t("signOut")}
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-h-screen" style={{ background: "#080810" }}>
        {children}
      </main>

      {/* ── Mobile bottom nav ───────────────────────────────── */}
      <nav
        aria-label={t("mobileNavAriaLabel")}
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around p-2 z-50"
        style={{ background: "#09090F", borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className="flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors"
              style={{ color: active ? "#818CF8" : "rgba(255,255,255,0.38)" }}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
