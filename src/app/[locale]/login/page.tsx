"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, User, Briefcase, Lock, Package, Eye, EyeOff, Mail, ChevronDown } from "lucide-react";
import { loginSchema } from "@/lib/validations/auth";

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
    <main className="min-h-screen w-full flex items-center justify-center font-sans p-4 sm:p-8 relative overflow-hidden bg-bg-base text-text-primary selection:bg-[#f59e0b] selection:text-[#09090b] transition-theme">

      {/* ── Fondo ── */}
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

      {/* ── Tarjeta ── */}
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
              href="/"
              className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase text-text-primary/30 hover:text-[#f59e0b] transition-colors duration-300 mb-10 group w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-300" />
              {t("back")}
            </Link>

            {/* Marca */}
            <div className="flex items-center gap-3.5 mb-7">
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

            <p className="text-text-primary/35 text-xs leading-relaxed tracking-wide mb-8">{t("accessSubtitle")}</p>

            {/* Selector de rol */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {(["RESIDENTE", "CONSERJE"] as Role[]).map((role) => {
                const isSelected = selectedRole === role;
                const Icon = role === "RESIDENTE" ? User : Briefcase;
                const label = role === "RESIDENTE" ? t("residenteLabel") : t("conserjeLabel");
                const subtag = role === "RESIDENTE" ? t("residenteSubtag") : t("conserjeSubtag");
                return (
                  <button
                    key={role}
                    id={`role-${role.toLowerCase()}`}
                    onClick={() => setSelectedRole(role)}
                    aria-pressed={isSelected}
                    className={`py-5 px-3 rounded-xl border flex flex-col items-center justify-center gap-2.5 transition-all duration-300 relative overflow-hidden group ${isSelected
                      ? "border-[#f59e0b]/35 bg-[#f59e0b]/[0.07] text-text-primary shadow-[0_0_24px_rgba(245,158,11,0.08)]"
                      : "border-border-subtle bg-bg-surface/30 text-text-primary/30 hover:text-text-primary/65 hover:border-text-primary/10 hover:bg-bg-surface/50"
                      }`}
                  >
                    {isSelected && <div className="absolute inset-0 bg-gradient-to-b from-[#f59e0b]/[0.06] to-transparent pointer-events-none" />}
                    <Icon className={`w-5 h-5 transition-colors duration-300 ${isSelected ? "text-[#f59e0b]" : "text-text-primary/20 group-hover:text-text-primary/45"}`} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase relative">{label}</span>
                    <span className={`text-[9px] tracking-wide font-medium transition-all duration-300 ${isSelected ? "text-[#f59e0b]/55 opacity-100 max-h-4" : "text-transparent opacity-0 max-h-0"}`}>
                      {subtag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Separador OAuth */}
            <div className="flex items-center gap-3 mb-6 text-text-primary/18 text-[9px] uppercase tracking-[0.3em] justify-center">
              <div className="flex-1 h-px bg-border-subtle" />
              {t("oauthSeparator")}
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* Botón Google */}
            <button
              id="btn-google-signin"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-text-primary hover:bg-text-primary/90 active:scale-[0.98] text-bg-base font-bold py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative group shadow-[0_2px_24px_rgba(0,0,0,0.15)] cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-bg-base/20 border-t-bg-base animate-spin shrink-0" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              <span className="text-[11px] tracking-[0.2em] font-bold uppercase">
                {isLoading ? t("signingIn") : t("signInGoogle")}
              </span>
              {!isLoading && <Lock className="absolute right-4 w-3 h-3 text-bg-base/20 group-hover:text-bg-base/40 transition-colors duration-200" />}
            </button>

            {/* ── Toggle credenciales ── */}
            <button
              type="button"
              onClick={() => { setShowCredForm((v) => !v); setCredError(""); setFieldErrors({}); }}
              className="w-full flex items-center gap-3 mt-5 text-text-primary/18 text-[9px] uppercase tracking-[0.3em] justify-center group cursor-pointer"
            >
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="group-hover:text-text-primary/35 transition-colors duration-200">{t("credentialsSeparator")}</span>
              <ChevronDown
                className={`w-3 h-3 text-text-primary/25 group-hover:text-text-primary/40 transition-all duration-300 ${showCredForm ? "rotate-180" : ""}`}
              />
              <div className="flex-1 h-px bg-border-subtle" />
            </button>

            {/* ── Formulario credenciales ── */}
            <div
              style={{
                maxHeight: showCredForm ? "400px" : "0px",
                opacity: showCredForm ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.35s ease, opacity 0.3s ease",
              }}
            >
              <form onSubmit={handleCredentialsSignIn} className="mt-5 flex flex-col gap-3" noValidate>

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-text-primary/30">
                    {t("emailLabel")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-primary/20 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
                      placeholder={t("emailPlaceholder")}
                      autoComplete="email"
                      className={`w-full bg-bg-surface/30 border rounded-lg pl-9 pr-4 py-2.5 text-xs text-text-primary/80 placeholder-text-primary/20 outline-none transition-all duration-200 focus:bg-bg-surface/50 focus:border-[#f59e0b]/30 ${fieldErrors.email ? "border-red-500/50" : "border-border-subtle"
                        }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-[10px] text-red-400/80 tracking-wide">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Contraseña */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-text-primary/30">
                    {t("passwordLabel")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-primary/20 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`w-full bg-bg-surface/30 border rounded-lg pl-9 pr-10 py-2.5 text-xs text-text-primary/80 placeholder-text-primary/20 outline-none transition-all duration-200 focus:bg-bg-surface/50 focus:border-[#f59e0b]/30 ${fieldErrors.password ? "border-red-500/50" : "border-border-subtle"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-primary/25 hover:text-text-primary/50 transition-colors duration-200"
                      tabIndex={-1}
                    >
                      {showPassword
                        ? <EyeOff className="w-3.5 h-3.5" />
                        : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[10px] text-red-400/80 tracking-wide">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Error global */}
                {credError && (
                  <p className="text-[11px] text-red-400/90 text-center tracking-wide bg-red-500/[0.08] border border-red-500/15 rounded-lg py-2 px-3">
                    {credError}
                  </p>
                )}

                {/* Botón ingresar */}
                <button
                  type="submit"
                  disabled={credLoading}
                  className="w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 active:scale-[0.98] text-[#09090b] font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] uppercase shadow-[0_2px_20px_rgba(245,158,11,0.2)] mt-1 cursor-pointer"
                >
                  {credLoading && <div className="w-3.5 h-3.5 rounded-full border-2 border-[#09090b]/20 border-t-[#09090b] animate-spin shrink-0" />}
                  {credLoading ? t("signingIn") : t("signInEmail")}
                </button>

                {/* Crear cuenta */}
                <p className="text-center text-text-primary/25 text-[10px] tracking-wide mt-1">
                  {t("noAccount")}{" "}
                  <Link href="/register" className="text-[#f59e0b]/70 hover:text-[#f59e0b] transition-colors duration-200 font-semibold">
                    {t("createAccount")}
                  </Link>
                </p>

              </form>
            </div>

            {/* Nota de privacidad */}
            <p className="text-center text-text-primary/18 text-[9px] tracking-wider leading-relaxed mt-6">
              {t("footerText")}
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}
