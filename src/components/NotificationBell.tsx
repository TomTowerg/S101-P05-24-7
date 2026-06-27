"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function formatRelativeTime(
  dateStr: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
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

export default function NotificationBell() {
  const t = useTranslations("Concierge");
  const { status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const isAuthorized = status === "authenticated";

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isAuthorized]);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(unread.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" })));
  };

  if (!isAuthorized) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("notificationsLabel")}
        className="relative flex items-center justify-center p-2 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
      >
        <Bell className="w-5 h-5 text-[#A0A0A0] hover:text-white" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-[#6366F1] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-4 top-[72px] w-[340px] max-w-[calc(100vw-2rem)] z-50 max-h-[440px] bg-[#1F1F1F] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#141414]/50 shrink-0">
                <span className="text-sm font-semibold text-white">{t("notificationsLabel")}</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#6366F1] hover:text-[#4F46E5] transition-colors cursor-pointer"
                  >
                    {t("markAllRead")}
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#141414] flex items-center justify-center border border-white/[0.08]">
                      <Bell className="w-5 h-5 text-[#606060]" aria-hidden="true" />
                    </div>
                    <p className="text-sm text-[#606060]">{t("noNotifications")}</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markRead(n.id)}
                      className={`flex items-start gap-3 px-4 py-3 rounded-xl mx-1 my-0.5 cursor-pointer transition-colors hover:bg-white/[0.03] ${
                        n.read ? "" : "bg-indigo-500/5"
                      }`}
                    >
                      <div
                        className="mt-[5px] shrink-0 w-2 h-2 rounded-full"
                        style={{ background: n.read ? "transparent" : "#6366F1" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-medium text-white leading-snug">{n.title}</p>
                          {!n.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                              className="shrink-0 text-[#6366F1] text-[10px] font-medium hover:text-[#4F46E5] transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {t("markAsRead")}
                            </button>
                          )}
                        </div>
                        <p className="text-[12px] text-[#A0A0A0] mt-1 leading-relaxed break-words">{n.message}</p>
                        <p className="text-[11px] text-[#606060] mt-1.5 font-medium">
                          {formatRelativeTime(n.createdAt, t)}
                        </p>
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
  );
}
