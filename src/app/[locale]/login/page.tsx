"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock, Eye, EyeOff, Mail, ChevronDown } from "lucide-react";
import { loginSchema } from "@/lib/validations/auth";
import { motion } from "framer-motion";

type Role = "CONSERJE" | "RESIDENTE";

export default function LoginPage() {
  const t = useTranslations("Login");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showCredForm, setShowCredForm] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [credLoading, setCredLoading] = useState(false);
  const [credError, setCredError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => { setMounted(true); }, []);

  const roleFromUrl = searchParams.get("role")?.toUpperCase() as Role | null;
  const initialRole: Role =
    roleFromUrl === "CONSERJE" || roleFromUrl === "RESIDENTE" ? roleFromUrl : "RESIDENTE";
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);

  useEffect(() => {
    const r = searchParams.get("role")?.toUpperCase() as Role | null;
    if (r === "CONSERJE" || r === "RESIDENTE") setSelectedRole(r);
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", {
        redirect: true,
        callbackUrl: `/api/auth/set-role?role=${selectedRole}&next=/dashboard`,
      });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCredError("");
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password, role: selectedRole });
    if (!parsed.success) {
      const mapped: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string | undefined;
        if (field && !mapped[field]) mapped[field] = issue.message;
      }
      setFieldErrors(mapped);
      return;
    }

    setCredLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      role: selectedRole,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/dashboard");
    } else {
      setCredError(t("invalidCredentials"));
      setCredLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.3s ease" }}>

      {/* LEFT PANEL — branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-[#141414] border-r border-white/[0.06] relative overflow-hidden">

        {/* Background decorative glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#6366F1]/[0.06] rounded-full blur-[120px]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366F1]">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
          <span
            style={{ fontFamily: "var(--font-syne, sans-serif)", fontWeight: 700, letterSpacing: "0.12em", fontSize: "18px" }}
            className="text-white uppercase"
          >
            Loombox
          </span>
        </div>

        {/* Center content */}
        <div className="relative space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-[48px] font-bold text-white leading-tight mb-4">
              {t("accessBrand")}
            </h2>
            <p className="text-[16px] text-[#A0A0A0] leading-relaxed max-w-sm">
              {t("accessSubtitle")}
            </p>
          </motion.div>

          {/* Feature chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {["QR Codes", "Notificaciones", "2 Roles", "i18n"].map((f) => (
              <span
                key={f}
                className="bg-white/[0.06] text-[#A0A0A0] text-[12px] rounded-full px-3 py-1 border border-white/[0.08]"
              >
                {f}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom credits */}
        <p className="relative text-[12px] text-[#606060]">TICS420 — 2026</p>
      </div>

      {/* RIGHT PANEL — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#1F1F1F]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm space-y-6"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366F1]">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
            <span className="text-white font-bold text-sm tracking-widest uppercase">Loombox</span>
          </div>

          {/* Back link */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase text-[#606060] hover:text-[#A0A0A0] transition-colors duration-200"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              {t("back")}
            </Link>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-[32px] font-bold text-white mb-2">{t("accessTitle")}</h1>
            <p className="text-[15px] text-[#A0A0A0]">{t("accessSubtitle")}</p>
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[#606060] uppercase tracking-widest">{t("accessTitle")}</p>
            <div className="grid grid-cols-2 gap-3">
              {(["RESIDENTE", "CONSERJE"] as Role[]).map((role) => {
                const isSelected = selectedRole === role;
                const label = role === "RESIDENTE" ? t("residenteLabel") : t("conserjeLabel");
                return (
                  <button
                    key={role}
                    id={`role-${role.toLowerCase()}`}
                    onClick={() => setSelectedRole(role)}
                    aria-pressed={isSelected}
                    className={`py-3 rounded-xl text-[14px] font-medium transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-[#6366F1]/10 border-[#6366F1]/40 text-[#6366F1]"
                        : "bg-[#262626] border-white/[0.08] text-[#A0A0A0] hover:border-white/[0.16]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3 text-[#606060] text-[10px] uppercase tracking-[0.3em]">
            <div className="flex-1 h-px bg-white/[0.08]" />
            {t("oauthSeparator")}
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Google login button */}
          <button
            id="btn-google-signin"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 rounded-full px-6 py-3.5 text-[15px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin shrink-0" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>
              {isLoading ? t("signingIn") : t("signInGoogle")}
            </span>
          </button>

          {/* Credentials toggle */}
          <button
            type="button"
            onClick={() => { setShowCredForm((v) => !v); setCredError(""); setFieldErrors({}); }}
            className="w-full flex items-center gap-3 text-[#606060] text-[10px] uppercase tracking-[0.3em] justify-center group cursor-pointer"
          >
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="group-hover:text-[#A0A0A0] transition-colors duration-200">{t("credentialsSeparator")}</span>
            <ChevronDown
              className={`w-3 h-3 text-[#606060] group-hover:text-[#A0A0A0] transition-all duration-300 ${showCredForm ? "rotate-180" : ""}`}
            />
            <div className="flex-1 h-px bg-white/[0.08]" />
          </button>

          {/* Credentials form */}
          <div
            style={{
              maxHeight: showCredForm ? "400px" : "0px",
              opacity: showCredForm ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 0.35s ease, opacity 0.3s ease",
            }}
          >
            <form onSubmit={handleCredentialsSignIn} className="flex flex-col gap-4" noValidate>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#A0A0A0]">
                  {t("emailLabel")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060] pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
                    placeholder={t("emailPlaceholder")}
                    autoComplete="email"
                    className={`w-full bg-[#262626] border rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder-[#606060] outline-none transition-all duration-200 focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/20 ${
                      fieldErrors.email ? "border-red-500/50" : "border-white/[0.08]"
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-400/80 tracking-wide">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#A0A0A0]">
                  {t("passwordLabel")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060] pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full bg-[#262626] border rounded-xl pl-10 pr-10 py-3 text-[14px] text-white placeholder-[#606060] outline-none transition-all duration-200 focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/20 ${
                      fieldErrors.password ? "border-red-500/50" : "border-white/[0.08]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#606060] hover:text-[#A0A0A0] transition-colors duration-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-red-400/80 tracking-wide">{fieldErrors.password}</p>
                )}
              </div>

              {/* Global error */}
              {credError && (
                <p className="text-[12px] text-red-400/90 text-center tracking-wide bg-red-500/[0.08] border border-red-500/15 rounded-xl py-2.5 px-3">
                  {credError}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={credLoading}
                className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full px-6 py-3.5 text-[15px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {credLoading && <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin shrink-0" />}
                {credLoading ? t("signingIn") : t("signInEmail")}
              </button>

              {/* Create account */}
              <p className="text-center text-[#606060] text-[12px] tracking-wide">
                {t("noAccount")}{" "}
                <Link href="/register" className="text-[#6366F1] hover:text-[#4F46E5] transition-colors duration-200 font-semibold">
                  {t("createAccount")}
                </Link>
              </p>

            </form>
          </div>

          {/* Privacy note */}
          <p className="text-center text-[#606060] text-[11px] tracking-wider leading-relaxed">
            {t("footerText")}
          </p>

        </motion.div>
      </div>
    </div>
  );
}
