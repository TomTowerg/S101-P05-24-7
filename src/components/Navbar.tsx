/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { User, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const t        = useTranslations("Navbar");
  const locale   = useLocale();
  const pathname = usePathname();
  const router   = useRouter();

  const { status } = useSession();

  const isLoginPage       = pathname === "/login";
  const isHomePage        = pathname === "/";
  const isAuthPage        = pathname.includes("/auth/verify-totp") || pathname.includes("/auth/setup-totp");
  const isDashboard       = pathname.includes("/dashboard");
  const isResidentPage    = pathname.includes("/dashboard/resident") && !pathname.includes("/profile");
  const isTransparent     = isHomePage || isAuthPage || isDashboard;

  const toggleLocale = () => {
    router.replace(pathname, { locale: locale === "es" ? "en" : "es" });
  };

  if (isLoginPage) return null;

  /* ── Language toggle (reusable) ─────────────────────────────── */
  const LangToggle = () => (
    <button
      onClick={toggleLocale}
      aria-label={t("changeLanguage")}
      className="flex items-center gap-2 group cursor-pointer"
    >
      <svg
        className="w-4 h-4 transition-colors group-hover:text-white text-white/60"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase transition-colors group-hover:text-white text-white/60">
        {locale === "es" ? "EN" : "ES"}
      </span>
    </button>
  );

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      isTransparent
        ? "bg-transparent border-b border-transparent"
        : "bg-[#080810]/95 backdrop-blur-xl border-b border-white/[0.07]"
    }`}>

      {/* ── RESIDENT DASHBOARD LAYOUT ─────────────────────────── */}
      {isResidentPage ? (
        <div className="w-full flex items-center justify-between px-6 py-3.5">

          {/* Left: logo + lang */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 select-none">
              <img src="/images/logo.png" alt="Loombox"
                style={{ width: 24, height: 24, objectFit: "contain" }} />
              <span className="text-white font-bold text-[13px] tracking-[0.14em] uppercase hidden sm:block"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                Loombox
              </span>
            </Link>
            <span className="w-px h-4 bg-white/[0.10] hidden sm:block" />
            <LangToggle />
          </div>

          {/* Right: bell + profile + sign-out */}
          <div className="flex items-center gap-1">
            {status === "authenticated" && <NotificationBell />}
            <Link
              href="/dashboard/profile"
              aria-label="Perfil"
              className="p-2.5 rounded-xl transition-colors duration-150 cursor-pointer"
              style={{ color: "rgba(255,255,255,0.50)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.90)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.50)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <User className="w-4 h-4" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Cerrar sesión"
              className="p-2.5 rounded-xl transition-colors duration-150 cursor-pointer"
              style={{ color: "rgba(255,255,255,0.50)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.90)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.50)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      ) : (
        /* ── DEFAULT LAYOUT ───────────────────────────────────── */
        <div className="w-full flex items-center justify-between px-8 py-5">

          {/* Left: lang toggle */}
          <div className="w-36 flex items-center gap-4">
            <LangToggle />
          </div>

          {/* Center: Logo */}
          <Link href="/" className="flex items-center gap-3 group select-none">
            <img src="/images/logo.png" alt="Loombox" width={30} height={30}
              className="shrink-0"
              style={{ width: "30px", height: "30px", objectFit: "contain" }} />
            <span
              className="text-white"
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: "16px", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1,
              }}
            >
              Loombox
            </span>
          </Link>

          {/* Right: bell or login */}
          <div className="w-36 flex items-center justify-end gap-2">
            {status === "authenticated" && pathname.startsWith("/dashboard") ? (
              <NotificationBell />
            ) : !isAuthPage ? (
              <Link href="/login" aria-label={t("signIn")}
                className="flex items-center gap-2 transition-colors group">
                <User
                  className={`w-3.5 h-3.5 transition-colors group-hover:text-white ${isTransparent ? "text-white/70" : "text-[#A0A0A0]"}`}
                  strokeWidth={1.5}
                />
                <span className={`text-[10px] tracking-[0.2em] uppercase hidden sm:inline font-medium transition-colors group-hover:text-white ${isTransparent ? "text-white/70" : "text-[#A0A0A0]"}`}>
                  {t("login")}
                </span>
              </Link>
            ) : <div className="w-6" />}
          </div>
        </div>
      )}
    </nav>
  );
}
