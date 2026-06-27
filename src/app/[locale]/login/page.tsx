"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRouter as useI18nRouter, usePathname } from "@/i18n/routing";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@/lib/validations/auth";

type Role = "CONSERJE" | "RESIDENTE";

export default function LoginPage() {
  const t = useTranslations("Login");
  const router = useRouter();
  const i18nRouter = useI18nRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const toggleLocale = () => {
    i18nRouter.replace(pathname, { locale: locale === "es" ? "en" : "es" });
  };

  const [isLoading, setIsLoading]       = useState(false);
  const [mounted, setMounted]           = useState(false);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [credLoading, setCredLoading]   = useState(false);
  const [credError, setCredError]       = useState("");
  const [fieldErrors, setFieldErrors]   = useState<Record<string, string>>({});

  useEffect(() => { setMounted(true); }, []);

  const roleFromUrl = searchParams.get("role")?.toUpperCase() as Role | null;
  const initialRole: Role = roleFromUrl === "CONSERJE" || roleFromUrl === "RESIDENTE" ? roleFromUrl : "RESIDENTE";
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
      email, password, role: selectedRole, redirect: false,
    });

    if (result?.ok) {
      router.push("/dashboard");
    } else {
      setCredError(t("invalidCredentials"));
      setCredLoading(false);
    }
  };

  return (
    <div
      className="-mt-16 relative min-h-screen w-full overflow-hidden"
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease" }}
    >
      {/* ── Imagen de fondo full-screen ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/lobby.jpeg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "center center" }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/mockups/fondo_1920_x_1080_3.png";
          (e.currentTarget as HTMLImageElement).onerror = null;
        }}
      />

      {/* ── Overlay oscuro para legibilidad ── */}
      <div className="absolute inset-0 bg-black/55" />
      {/* Gradiente más fuerte en el lado del form */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      {/* Gradiente vertical suave */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* ── Layout: flex h-screen ── */}
      <div className="relative z-10 flex min-h-screen">

        {/* ══════════════════════════════════
            PANEL IZQUIERDO — Glass sidebar
        ══════════════════════════════════ */}
        <div className="flex w-full md:w-[44%] lg:w-[40%] shrink-0 pt-6 pb-6 pl-6 pr-3">

          {/* Panel glass — deja imagen visible alrededor */}
          <div
            className="relative flex-1 flex items-center justify-center px-6 py-8"
            style={{
              background: "rgba(8, 8, 8, 0.48)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
          {/* Toggle de idioma — esquina superior izquierda */}
          <button
            onClick={toggleLocale}
            className="absolute top-4 left-4 flex items-center gap-1.5 group cursor-pointer"
            aria-label="Cambiar idioma"
          >
            <svg
              className="w-3.5 h-3.5 text-white/40 transition-colors group-hover:text-white/80"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/40 transition-colors group-hover:text-white/80">
              {locale === "es" ? "EN" : "ES"}
            </span>
          </button>

          {/* Botón volver — esquina superior derecha */}
          <Link
            href="/"
            className="absolute top-4 right-4 flex items-center gap-1.5 group cursor-pointer"
            aria-label={t("backToHome")}
          >
            <svg
              className="w-3.5 h-3.5 text-white/40 transition-colors group-hover:text-white/80"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/40 transition-colors group-hover:text-white/80">
              {t("back")}
            </span>
          </Link>

          {/* Contenido centrado con ancho máximo */}
          <div className="w-full max-w-[310px]">
            {/* Logo Loombox */}
            <div className="flex justify-center mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.png"
                alt="Loombox"
                width={60}
                height={60}
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "contain",
                }}
              />
            </div>

            {/* Heading */}
            <div className="text-center mb-5">
              <h1 className="text-[28px] font-bold text-white leading-tight mb-1.5">
                {t("welcomeBack")}
              </h1>
              <p className="text-[14px] text-white/40">{t("accessSubtitle")}</p>
            </div>

            {/* Role selector */}
            <div className="flex justify-center mb-5">
              <div
                className="flex items-center rounded-full p-[3px] gap-0"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {(["RESIDENTE", "CONSERJE"] as Role[]).map((role) => {
                  const isSelected = selectedRole === role;
                  const label = role === "RESIDENTE" ? t("residenteLabel") : t("conserjeLabel");
                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      aria-pressed={isSelected}
                      className="px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer"
                      style={isSelected ? {
                        background: "rgba(99,102,241,0.25)",
                        border: "1px solid rgba(99,102,241,0.45)",
                        color: "rgba(165,167,255,1)",
                      } : {
                        background: "transparent",
                        border: "1px solid transparent",
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google */}
            <button
              id="btn-google-signin"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-[50px] rounded-xl text-[15px] font-medium transition-all cursor-pointer flex items-center justify-center gap-3 mb-4 disabled:opacity-40"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.11)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>{isLoading ? t("signingIn") : t("signInGoogle")}</span>
            </button>

            {/* OR */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-white/20 text-[10px] uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="block text-[13px] font-medium text-white/50 mb-1.5">{t("emailLabel")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                className={`w-full rounded-xl px-4 py-3 text-[15px] text-white outline-none transition-all duration-200 ${
                  fieldErrors.email ? "border-red-500/40" : "border-white/[0.1]"
                }`}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${fieldErrors.email ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = fieldErrors.email ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)")}
              />
              {fieldErrors.email && <p className="text-[11px] text-red-400/80 mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-white/50">{t("passwordLabel")}</label>
                <button type="button" className="text-[12px] text-white/30 hover:text-white/60 transition-colors cursor-pointer">
                  {t("forgotPassword")}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="current-password"
                  className="w-full rounded-xl px-4 pr-11 py-3 text-[15px] text-white outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${fieldErrors.password ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = fieldErrors.password ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-[11px] text-red-400/80 mt-1">{fieldErrors.password}</p>}
            </div>

            {credError && (
              <p className="text-[11px] text-red-400/80 text-center rounded-xl py-2 px-3 mb-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                {credError}
              </p>
            )}

            {/* Log in */}
            <form onSubmit={handleCredentialsSignIn}>
              <button
                type="submit"
                disabled={credLoading}
                className="w-full bg-white hover:bg-white/90 text-[#0A0A0A] rounded-xl px-6 py-3.5 text-[15px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mb-4"
              >
                {credLoading && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 border-t-gray-900 animate-spin shrink-0" />}
                {credLoading ? t("signingIn") : t("signInEmail")}
              </button>
            </form>

            {/* Sign up */}
            <p className="text-center text-white/30 text-[13px]">
              {t("noAccount")}{" "}
              <Link href="/register" className="text-white/70 font-semibold hover:text-white transition-colors underline underline-offset-2 decoration-white/20">
                {t("createAccount")}
              </Link>
            </p>
          </div>{/* /max-w */}
          </div>{/* /glass panel */}
        </div>{/* /left column */}

        {/* ══════════════════════════════════
            PANEL DERECHO — Texto sobre imagen
        ══════════════════════════════════ */}
        <div className="hidden md:flex flex-1 flex-col justify-end p-10 lg:p-14">
          <p className="text-white/30 text-[10px] uppercase tracking-[0.35em] font-medium mb-3">
            {t("heroBrand")}
          </p>
          <h2 className="text-white font-light leading-tight mb-3" style={{ fontSize: "clamp(22px, 2.4vw, 30px)" }}>
            {t("heroHeadline")}<br />
            <span className="font-bold">{t("heroHighlight")}</span>
          </h2>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-[260px] mb-6">
            {t("heroDescription")}
          </p>
          <div className="flex items-center gap-6">
            {[
              { value: "100%", label: t("stat1Label") },
              { value: "24/7", label: t("stat2Label") },
              { value: "QR",   label: t("stat3Label") },
            ].map(({ value, label }) => (
              <div key={value} className="flex flex-col gap-0.5">
                <span className="text-white font-bold text-[15px] leading-none">{value}</span>
                <span className="text-white/30 text-[10px] uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
