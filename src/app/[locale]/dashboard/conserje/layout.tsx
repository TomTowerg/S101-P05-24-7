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
  Bell
} from "lucide-react";
import { ReactNode, useState, useEffect } from "react";

export default function ConciergeLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const t = useTranslations("Concierge");
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  };

  const navItems = [
    { href: "/dashboard/conserje", icon: LayoutDashboard, label: "Resumen" },
    { href: "/dashboard/conserje/packages", icon: PackageSearch, label: "Paquetes" },
    { href: "/dashboard/conserje/reports", icon: BarChart3, label: "Reportes" },
    { href: "/dashboard/conserje/claims", icon: AlertCircle, label: "Reclamos" }
  ];

  const isActive = (path: string) => {
    // pathname includes the locale, so we need to check if it ends with or matches
    if (path === "/dashboard/conserje") {
      return pathname.endsWith("/dashboard/conserje");
    }
    return pathname.includes(path);
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col md:flex-row pt-[68px] transition-theme">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-bg-surface border-r border-border-subtle flex flex-col hidden md:flex h-[calc(100vh-68px)] sticky top-[68px] transition-theme">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md shadow-indigo-200">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary text-lg leading-none tracking-tight">Loombox</h2>
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600">Conserje</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  active
                    ? "bg-indigo-500/15 text-indigo-600"
                    : "text-text-muted hover:bg-bg-base hover:text-text-primary"
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "text-indigo-600" : "text-text-muted/65"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border-subtle">
          <div className="mb-4 px-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/25">
              {session?.user?.name?.charAt(0) || "C"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-text-primary truncate">{session?.user?.name || "Conserje"}</p>
              <p className="text-[10px] text-text-muted truncate">{session?.user?.email}</p>
            </div>
          </div>

          {/* Notification bell */}
          <div className="relative mb-2">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-text-muted hover:bg-bg-base hover:text-text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
              aria-label="Notificaciones"
            >
              <div className="relative">
                <Bell className="w-4 h-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Overlay */}
            {showNotifications && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
            )}

            {/* Dropdown */}
            {showNotifications && (
              <div className="fixed left-2 right-2 bottom-16 md:left-64 md:right-auto md:bottom-4 md:w-80 z-50 max-h-96 bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-base/40">
                  <span className="text-sm font-bold text-text-primary">Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-6 h-6 text-text-muted/30 mx-auto mb-2" />
                      <p className="text-xs text-text-muted">Sin notificaciones</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-border-subtle last:border-0 transition-colors ${
                          n.read ? "opacity-50" : "bg-indigo-500/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-text-primary truncate">{n.title}</p>
                            <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed break-words">{n.message}</p>
                            <p className="text-[10px] text-text-muted/50 mt-1">
                              {new Date(n.createdAt).toLocaleDateString()}{" "}
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          {!n.read && (
                            <button
                              onClick={() => markRead(n.id)}
                              className="shrink-0 mt-0.5 px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 text-[10px] font-bold hover:bg-indigo-500/25 transition-colors cursor-pointer"
                            >
                              Leer
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t("signOut").toUpperCase()}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden min-h-[calc(100vh-68px)]">
        {children}
      </main>

      {/* Mobile Navigation (Bottom bar) */}
      <nav aria-label="Navegación móvil" className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border-subtle flex justify-around p-2 z-50 transition-theme">
         {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={`flex flex-col items-center p-2 rounded-lg ${
                  active ? "text-indigo-600" : "text-text-muted"
                }`}
              >
                <item.icon className="w-5 h-5 mb-1" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className={`flex flex-col items-center p-2 rounded-lg relative ${
              unreadCount > 0 ? "text-red-400" : "text-text-muted"
            } cursor-pointer`}
            aria-label="Notificaciones"
          >
            <div className="relative">
              <Bell className="w-5 h-5 mb-1" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase">Avisos</span>
          </button>
      </nav>
    </div>
  );
}
