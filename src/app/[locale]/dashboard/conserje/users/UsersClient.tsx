"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Users, Loader2, Mail, ArrowLeft } from "lucide-react";
import EmptyState from "@/components/EmptyState";

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  onboardingComplete: boolean;
  createdAt: string;
  apartment: {
    number: string;
    tower: string | null;
  } | null;
}

export default function UsersClient() {
  const t = useTranslations("Users");
  const tCommon = useTranslations("DashboardCommon");
  const router = useRouter();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (userId: string, newRole: string) => {
    setProcessingId(userId);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base pt-[68px] transition-theme">
      <div className="bg-bg-surface border-b border-border-subtle transition-theme">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-950/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t("title")}</h1>
              <p className="text-text-muted text-sm font-medium">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/conserje")}
            className="px-6 py-2.5 bg-bg-base border border-border-subtle hover:bg-bg-surface text-text-primary rounded-xl font-bold transition-all text-sm flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4"/>
            {tCommon("back")}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-10">
        <div className="bg-bg-surface rounded-2xl shadow-sm border border-border-subtle overflow-hidden transition-theme">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-base border-b border-border-subtle">
                  <th className="px-3 md:px-6 py-3 md:py-4 text-xs font-bold text-text-muted uppercase tracking-widest">{t("name")}</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-xs font-bold text-text-muted uppercase tracking-widest">{t("email")}</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-xs font-bold text-text-muted uppercase tracking-widest">{t("role")}</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-xs font-bold text-text-muted uppercase tracking-widest">{t("status")}</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-xs font-bold text-text-muted uppercase tracking-widest">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8">
                      <EmptyState
                        icon={Users}
                        title={t("emptyTitle")}
                        description={t("emptyDesc")}
                      />
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-bg-base/50 transition-colors">
                      <td className="px-3 md:px-6 py-3 md:py-4 font-medium text-text-primary text-xs md:text-sm">{u.name || "—"}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 flex items-center gap-2 text-text-muted text-xs md:text-sm">
                        <Mail className="w-4 h-4 shrink-0" /> {u.email}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                          u.role === "CONSERJE"
                            ? 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30'
                            : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <span className={`text-xs font-semibold ${u.onboardingComplete ? 'text-green-500' : 'text-amber-500'}`}>
                          {u.onboardingComplete ? t("active") : t("pending")}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        {processingId === u.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                        ) : (
                          <select 
                            className="bg-bg-base border border-border-subtle text-sm rounded-lg font-medium text-text-primary outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            value={u.role}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                          >
                            <option value="RESIDENTE">{t("demote")}</option>
                            <option value="CONSERJE">{t("promote")}</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
