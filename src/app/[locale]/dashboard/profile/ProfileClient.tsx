"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, User, Building, Mail, KeyRound, Loader2, ArrowLeft } from "lucide-react";

export default function ProfileClient({ user }: { user: any }) {
  const t = useTranslations("Profile");
  const tCommon = useTranslations("DashboardCommon");
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleDisable2FA = async () => {
    if (!confirm(t("disableConfirm"))) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/totp-disable", { method: "POST" });
      if (res.ok) {
        setSuccessMsg(t("disabledSuccess"));
        toast.success(t("saved"));
        setTimeout(() => {
          router.refresh();
          router.push("/auth/setup-totp");
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    const dest = user.role === "CONSERJE" ? "/dashboard/conserje" : "/dashboard/resident";
    router.push(dest);
  };

  return (
    <div className="min-h-screen pt-16" style={{ background: "#080810" }}>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-2xl"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)" }}
            >
              <User className="w-6 h-6" style={{ color: "#818CF8" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{t("title")}</h1>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.55)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.90)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon("back")}
          </button>
        </div>

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl flex items-center gap-3 text-sm font-medium"
            style={{
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.20)",
              color: "#34D399",
            }}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {successMsg}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0E0E1C", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <User className="w-4 h-4" style={{ color: "rgba(255,255,255,0.32)" }} />
              <h3 className="font-bold text-white text-sm">{t("personalInfo")}</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.32)" }}
                >
                  {t("role")}
                </label>
                <div className="mt-2">
                  <span
                    className="px-2.5 py-1 text-xs font-bold uppercase rounded-lg"
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      color: "#818CF8",
                      border: "1px solid rgba(99,102,241,0.22)",
                    }}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              <div>
                <label
                  className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                  style={{ color: "rgba(255,255,255,0.32)" }}
                >
                  <Mail className="w-3 h-3" />
                  {t("email")}
                </label>
                <div className="mt-2 text-sm font-medium text-white">{user.email}</div>
              </div>

              {user.role === "RESIDENTE" && user.apartment && (
                <div>
                  <label
                    className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                    style={{ color: "rgba(255,255,255,0.32)" }}
                  >
                    <Building className="w-3 h-3" />
                    {t("apartment")}
                  </label>
                  <div className="mt-2 text-sm font-medium text-white">
                    {user.apartment.number}
                    {user.apartment.tower ? ` (Torre ${user.apartment.tower})` : ""}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Security Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0E0E1C", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <KeyRound className="w-4 h-4" style={{ color: "rgba(255,255,255,0.32)" }} />
              <h3 className="font-bold text-white text-sm">{t("security")}</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-2xl shrink-0"
                  style={
                    user.totpEnabled
                      ? { background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.20)", color: "#34D399" }
                      : { background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.20)", color: "#FBBF24" }
                  }
                >
                  {user.totpEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm mb-2">{t("twoFactorDesc")}</h4>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.40)" }}>
                    {user.totpEnabled
                      ? "Tu cuenta está protegida por autenticación de dos factores. Desactivarla requerirá configurarla nuevamente al iniciar sesión."
                      : "No tienes 2FA activado. Se recomienda activarlo para mayor seguridad de tu cuenta."}
                  </p>
                  {user.totpEnabled ? (
                    <button
                      onClick={handleDisable2FA}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 disabled:opacity-50 cursor-pointer"
                      style={{
                        background: "rgba(239,68,68,0.10)",
                        color: "#F87171",
                        border: "1px solid rgba(239,68,68,0.20)",
                      }}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("disable2FA")}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/auth/setup-totp")}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 text-white cursor-pointer"
                      style={{ background: "rgba(99,102,241,0.85)" }}
                    >
                      {t("enable2FA")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
