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
import { motion, AnimatePresence } from "framer-motion";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function formatRelativeTime(dateStr: string, t: (key: string, values?: Record<string, string | number | Date>) => string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t("timeNow");
  if (diffMin < 60) return t("timeMinutesAgo", { count: diffMin });
  if (diffHours < 24) return t("timeHoursAgo", { count: diffHours });
  if (diffDays === 1) {
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return t("timeYesterdayAt", { time: timeStr });
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function ConciergeLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const t = useTranslations("Concierge");
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
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

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(
      unread.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" }))
    );
  };

  const navItems = [
    { href: "/dashboard/conserje", icon: LayoutDashboard, label: t("navResumen") },
    { href: "/dashboard/conserje/packages", icon: PackageSearch, label: t("navPaquetes") },
    { href: "/dashboard/conserje/reports", icon: BarChart3, label: t("navReportes") },
    { href: "/dashboard/conserje/claims", icon: AlertCircle, label: t("navReclamos") }
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
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600">{t("conciergeRoleBadge")}</span>
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
              <p className="text-sm font-bold text-text-primary truncate">{session?.user?.name || t("conciergeRoleBadge")}</p>
              <p className="text-[10px] text-text-muted truncate">{session?.user?.email}</p>
            </div>
          </div>

          {/* Notification bell */}
          <div className="relative mb-2">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-text-muted hover:bg-bg-base hover:text-text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
              aria-label={t("notificationsLabel")}
            >
              <div className="relative">
                <Bell className="w-4 h-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              {t("notificationsLabel")}
              {unreadCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />

                  {/* Dropdown */}
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed left-2 right-2 bottom-16 md:left-[264px] md:right-auto md:bottom-4 md:w-[340px] z-50 max-h-[420px] bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-base/50 shrink-0">
                      <span className="text-sm font-bold text-text-primary">{t("notificationsLabel")}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                        >
                          {t("markAllRead")}
                        </button>
                      )}
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-bg-base flex items-center justify-center border border-border-subtle">
                            <Bell className="w-5 h-5 text-text-muted/30" aria-hidden="true" />
                          </div>
                          <p className="text-xs font-medium text-text-muted">{t("noNotifications")}</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`flex items-start gap-3 px-4 py-3.5 border-b border-border-subtle last:border-0 transition-colors ${
                              n.read ? "" : "bg-indigo-500/5"
                            }`}
                          >
                            {/* Unread dot */}
                            <div className="mt-[5px] shrink-0 w-2 h-2 rounded-full transition-colors" style={{ background: n.read ? "transparent" : "#6366f1" }} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-text-primary leading-snug">{n.title}</p>
                                {!n.read && (
                                  <button
                                    onClick={() => markRead(n.id)}
                                    className="shrink-0 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 text-[10px] font-bold hover:bg-indigo-500/25 transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    {t("markAsRead")}
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-text-muted mt-1 leading-relaxed break-words">{n.message}</p>
                              <p className="text-[10px] text-text-muted/50 mt-1.5 font-medium">{formatRelativeTime(n.createdAt, t)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
            aria-label={t("notificationsLabel")}
          >
            <div className="relative">
              <Bell className="w-5 h-5 mb-1" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase">{t("alertsLabel")}</span>
          </button>
      </nav>
    </div>
  );
}
