"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, User, Building, Mail, KeyRound, Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-bg-base pt-[68px] transition-theme">
      <div className="bg-bg-surface border-b border-border-subtle transition-theme">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-950/20">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t("title")}</h1>
              <p className="text-text-muted text-sm font-medium">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={handleGoBack}
            className="px-6 py-2.5 bg-bg-base border border-border-subtle hover:bg-bg-surface text-text-primary rounded-xl font-bold transition-all text-sm cursor-pointer"
          >
            {tCommon("back")}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {successMsg && (
          <div className="bg-green-500/10 text-green-500 p-4 rounded-xl border border-green-500/20 font-medium flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Info Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-surface rounded-2xl shadow-sm border border-border-subtle overflow-hidden transition-theme">
            <div className="px-6 py-5 border-b border-border-subtle bg-bg-base/30 flex items-center gap-3">
              <User className="w-5 h-5 text-text-muted/60" />
              <h3 className="font-bold text-text-primary">{t("personalInfo")}</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">{t("role")}</label>
                <div className="mt-1 font-medium text-text-primary flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-indigo-500/15 text-indigo-500 text-xs font-bold uppercase rounded-md border border-indigo-500/25">
                    {user.role}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5"><Mail className="w-3 h-3"/> {t("email")}</label>
                <div className="mt-1 font-medium text-text-primary">{user.email}</div>
              </div>
 
              {user.role === "RESIDENTE" && user.apartment && (
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5"><Building className="w-3 h-3"/> {t("apartment")}</label>
                  <div className="mt-1 font-medium text-text-primary">{user.apartment.number} {user.apartment.tower ? `(Tower ${user.apartment.tower})` : ''}</div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Security Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-bg-surface rounded-2xl shadow-sm border border-border-subtle overflow-hidden transition-theme">
            <div className="px-6 py-5 border-b border-border-subtle bg-bg-base/30 flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-text-muted/60" />
              <h3 className="font-bold text-text-primary">{t("security")}</h3>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl border ${user.totpEnabled ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                  {user.totpEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-text-primary mb-1">{t("twoFactorDesc")}</h4>
                  <p className="text-sm text-text-muted mb-4">
                    {user.totpEnabled 
                      ? "Your account is currently protected by Google Authenticator 2FA. Disabling it will require you to set it up again next time you log in."
                      : "You do not have 2FA enabled. It is highly recommended to enable it for security."}
                  </p>
                  
                  {user.totpEnabled ? (
                    <button
                      onClick={handleDisable2FA}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold transition-all duration-200 text-sm border border-red-500/25 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("disable2FA")}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/auth/setup-totp")}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all duration-200 text-sm cursor-pointer"
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
