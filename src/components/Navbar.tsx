"use client";

import Link from "next/link";
import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { User } from "lucide-react";
import { useSession } from "next-auth/react";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const t        = useTranslations("Navbar");
  const locale   = useLocale();
  const pathname = usePathname();
  const router   = useRouter();

  const { data: session, status } = useSession();

  const toggleLocale = () => {
    router.replace(pathname, { locale: locale === "es" ? "en" : "es" });
  };

  return (
    <nav className="fixed top-0 w-full z-50 px-8 py-5 bg-[#141414]/95 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="w-full flex items-center justify-between">

        {/* ── Izquierda: Toggle de idioma ── */}
        <div className="w-36 flex items-center gap-4">
          <button
            onClick={toggleLocale}
            aria-label={t("changeLanguage")}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <svg
              className="w-4 h-4 text-[#A0A0A0] group-hover:text-white transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#A0A0A0] group-hover:text-white transition-colors">
              {locale === "es" ? "EN" : "ES"}
            </span>
          </button>
        </div>

        {/* ── Centro: Logo con Syne (fuente display del proyecto) ── */}
        <Link href="/" className="flex items-center gap-3 group select-none">

          {/* Ícono SVG: caja/paquete minimalista */}
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-[#6366F1] shrink-0"
          >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>

          {/* Texto LOOMBOX en Syne */}
          <span
            className="text-white"
            style={{
              fontFamily:    "var(--font-syne), sans-serif",
              fontSize:      "16px",
              fontWeight:    700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              lineHeight:    1,
            }}
          >
            Loombox
          </span>
        </Link>

        {/* ── Derecha: campana o botón ingresar ── */}
        <div className="w-36 flex items-center justify-end gap-2">
          {status === "authenticated" ? (
            <NotificationBell />
          ) : (
            <Link
              href="/login"
              aria-label={t("signIn")}
              className="flex items-center gap-2 transition-colors group"
            >
              <User className="w-3.5 h-3.5 text-[#A0A0A0] group-hover:text-white transition-colors" strokeWidth={1.5} />
              <span className="text-[10px] tracking-[0.2em] uppercase hidden sm:inline font-medium text-[#A0A0A0] group-hover:text-white transition-colors">
                {t('login')}
              </span>
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}
