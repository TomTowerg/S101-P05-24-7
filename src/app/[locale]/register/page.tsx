"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, User, Briefcase, Package, Eye, EyeOff, Mail, Lock, UserCircle, CheckCircle } from "lucide-react";
import { registerSchema } from "@/lib/validations/auth";

type Role = "CONSERJE" | "RESIDENTE";

function getPasswordStrength(pwd: string): "empty" | "weak" | "medium" | "strong" {
  if (!pwd) return "empty";
  const checks = [/[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^a-zA-Z0-9]/.test(pwd)];
  const passed = checks.filter(Boolean).length;
  if (pwd.length < 8) return "weak";
  if (passed === 3) return "strong";
  if (passed >= 1) return "medium";
  return "weak";
}

const strengthConfig = {
  empty:  { width: "0%",   color: "bg-white/10",      label: "" },
  weak:   { width: "33%",  color: "bg-red-500",        label: "strengthWeak" },
  medium: { width: "66%",  color: "bg-yellow-500",     label: "strengthMedium" },
  strong: { width: "100%", color: "bg-emerald-500",    label: "strengthStrong" },
} as const;

export default function RegisterPage() {
  const t = useTranslations("Register");
  const router = useRouter();

  const [mounted, setMounted]             = useState(false);
  const [selectedRole, setSelectedRole]   = useState<Role>("RESIDENTE");
  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [fieldErrors, setFieldErrors]     = useState<Record<string, string>>({});
  const [globalError, setGlobalError]     = useState("");
  const [success, setSuccess]             = useState(false);
  const [loading, setLoading]             = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const strength = getPasswordStrength(password);
  const { width: strWidth, color: strColor, label: strLabel } = strengthConfig[strength];

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError("");
    setFieldErrors({});

    const parsed = registerSchema.safeParse({ name, email, password, confirmPassword, role: selectedRole });
    if (!parsed.success) {
      const mapped: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string | undefined;
        if (field && !mapped[field]) mapped[field] = issue.message;
      }
      setFieldErrors(mapped);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword, role: selectedRole }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setFieldErrors({ email: t("errorEmailExists") });
        return;
      }
      if (!res.ok) {
        setGlobalError(t("errorGeneric"));
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setGlobalError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center font-sans p-4 sm:p-8 relative overflow-hidden bg-bg-base text-text-primary selection:bg-[#f59e0b] selection:text-[#09090b] transition-theme">

      {/* Fondo */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mockups/fondo_1920_x_1080.png"
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center 30%", opacity: 0.05, filter: "blur(10px) saturate(0.4)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-bg-base via-bg-base/95 to-bg-surface/50" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-[#f59e0b] rounded-full blur-[140px] opacity-[0.03]" />
      </div>

      {/* Tarjeta */}
      <div
        className="w-full max-w-md relative z-10"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <div className="bg-bg-surface/75 backdrop-blur-2xl rounded-2xl border border-border-subtle shadow-[0_0_80px_rgba(0,0,0,0.15)] overflow-hidden transition-theme">

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent opacity-50" />
          <div className="absolute -top-16 right-6 w-40 h-40 bg-[#f59e0b] rounded-full blur-[90px] opacity-[0.04] pointer-events-none" />

          <div className="p-8 sm:p-10">

            {/* Volver */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase text-text-primary/30 hover:text-[#f59e0b] transition-colors duration-300 mb-8 group w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-300" />
              {t("back")}
            </Link>

            {/* Marca */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-11 h-11 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-[#f59e0b]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[9px] font-semibold tracking-[0.35em] uppercase text-text-primary/25 mb-0.5">{t("accessTitle")}</p>
                <h1 className="text-xl font-bold text-text-primary tracking-[0.15em] uppercase leading-none" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                  {t("accessBrand")}
                </h1>
              </div>
            </div>

            <p className="text-text-primary/35 text-xs leading-relaxed tracking-wide mb-7">{t("accessSubtitle")}</p>

            {/* ── Éxito ── */}
            {success ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400" strokeWidth={1.5} />
                <p className="text-text-primary/70 text-sm tracking-wide">{t("successMessage")}</p>
                <p className="text-text-primary/25 text-[10px]">Redirigiendo...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

                {/* Selector de rol */}
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-text-primary/30 mb-2">{t("roleLabel")}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(["RESIDENTE", "CONSERJE"] as Role[]).map((role) => {
                      const isSelected = selectedRole === role;
                      const Icon = role === "RESIDENTE" ? User : Briefcase;
                      const label  = role === "RESIDENTE" ? t("residenteLabel")  : t("conserjeLabel");
                      const subtag = role === "RESIDENTE" ? t("residenteSubtag") : t("conserjeSubtag");
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSelectedRole(role)}
                          aria-pressed={isSelected}
                          className={`py-4 px-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group ${
                            isSelected
                              ? "border-[#f59e0b]/35 bg-[#f59e0b]/[0.07] text-text-primary shadow-[0_0_24px_rgba(245,158,11,0.08)]"
                              : "border-border-subtle bg-bg-surface/30 text-text-primary/30 hover:text-text-primary/65 hover:border-text-primary/10"
                          }`}
                        >
                          {isSelected && <div className="absolute inset-0 bg-gradient-to-b from-[#f59e0b]/[0.06] to-transparent pointer-events-none" />}
                          <Icon className={`w-4 h-4 transition-colors duration-300 ${isSelected ? "text-[#f59e0b]" : "text-text-primary/20 group-hover:text-text-primary/45"}`} strokeWidth={1.5} />
                          <span className="text-[10px] font-bold tracking-[0.18em] uppercase relative">{label}</span>
                          <span className={`text-[9px] font-medium transition-all duration-300 ${isSelected ? "text-[#f59e0b]/55" : "text-transparent"}`}>{subtag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nombre */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-text-primary/30">{t("nameLabel")}</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-primary/20 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                      placeholder={t("namePlaceholder")}
                      autoComplete="name"
                      className={`w-full bg-bg-surface/30 border rounded-lg pl-9 pr-4 py-2.5 text-xs text-text-primary/80 placeholder-text-primary/20 outline-none transition-all duration-200 focus:bg-bg-surface/55 focus:border-[#f59e0b]/30 ${fieldErrors.name ? "border-red-500/50" : "border-border-subtle"}`}
                    />
                  </div>
                  {fieldErrors.name && <p className="text-[10px] text-red-400/80">{fieldErrors.name}</p>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-text-primary/30">{t("emailLabel")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-primary/20 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                      placeholder={t("emailPlaceholder")}
                      autoComplete="email"
                      className={`w-full bg-bg-surface/30 border rounded-lg pl-9 pr-4 py-2.5 text-xs text-text-primary/80 placeholder-text-primary/20 outline-none transition-all duration-200 focus:bg-bg-surface/55 focus:border-[#f59e0b]/30 ${fieldErrors.email ? "border-red-500/50" : "border-border-subtle"}`}
                    />
                  </div>
                  {fieldErrors.email && <p className="text-[10px] text-red-400/80">{fieldErrors.email}</p>}
                </div>

                {/* Contraseña */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-text-primary/30">{t("passwordLabel")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-primary/20 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`w-full bg-bg-surface/30 border rounded-lg pl-9 pr-10 py-2.5 text-xs text-text-primary/80 placeholder-text-primary/20 outline-none transition-all duration-200 focus:bg-bg-surface/55 focus:border-[#f59e0b]/30 ${fieldErrors.password ? "border-red-500/50" : "border-border-subtle"}`}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-primary/25 hover:text-text-primary/50 transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Barra de fuerza */}
                  {password && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-bg-surface/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-400 ${strColor}`}
                          style={{ width: strWidth }}
                        />
                      </div>
                      {strLabel && (
                        <span className={`text-[9px] font-semibold tracking-wide shrink-0 ${
                          strength === "weak" ? "text-red-400" : strength === "medium" ? "text-yellow-400" : "text-emerald-400"
                        }`}>
                          {t(strLabel)}
                        </span>
                      )}
                    </div>
                  )}

                  {fieldErrors.password
                    ? <p className="text-[10px] text-red-400/80">{fieldErrors.password}</p>
                    : <p className="text-[9px] text-text-primary/20 tracking-wide">{t("passwordRequirements")}</p>
                  }
                </div>

                {/* Confirmar contraseña */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-text-primary/30">{t("confirmPasswordLabel")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-primary/20 pointer-events-none" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`w-full bg-bg-surface/30 border rounded-lg pl-9 pr-10 py-2.5 text-xs text-text-primary/80 placeholder-text-primary/20 outline-none transition-all duration-200 focus:bg-bg-surface/55 focus:border-[#f59e0b]/30 ${fieldErrors.confirmPassword ? "border-red-500/50" : "border-border-subtle"}`}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-primary/25 hover:text-text-primary/50 transition-colors" tabIndex={-1}>
                      {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <p className="text-[10px] text-red-400/80">{fieldErrors.confirmPassword}</p>}
                </div>

                {/* Error global */}
                {globalError && (
                  <p className="text-[11px] text-red-400/90 text-center bg-red-500/[0.08] border border-red-500/15 rounded-lg py-2 px-3">
                    {globalError}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 active:scale-[0.98] text-[#09090b] font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] uppercase shadow-[0_2px_20px_rgba(245,158,11,0.2)] mt-1 cursor-pointer"
                >
                  {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-[#09090b]/20 border-t-[#09090b] animate-spin shrink-0" />}
                  {loading ? t("submitting") : t("submitButton")}
                </button>

                {/* Link login */}
                <p className="text-center text-text-primary/25 text-[10px] tracking-wide">
                  {t("alreadyHaveAccount")}{" "}
                  <Link href="/login" className="text-[#f59e0b]/70 hover:text-[#f59e0b] transition-colors duration-200 font-semibold">
                    {t("signIn")}
                  </Link>
                </p>

              </form>
            )}

            {/* Footer */}
            <p className="text-center text-text-primary/18 text-[9px] tracking-wider leading-relaxed mt-6">
              {t("footerText")}
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}
