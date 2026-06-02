"use client";

import Link from "next/link";
import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { User, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const t        = useTranslations("Navbar");
  const locale   = useLocale();
  const pathname = usePathname();
  const router   = useRouter();

  // Detecta si el usuario ya scrolleó fuera del hero
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setMounted(true);
    const currentTheme = document.documentElement.classList.contains("light") ? "light" : "dark";
    setTheme(currentTheme);

    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const toggleLocale = () => {
    router.replace(pathname, { locale: locale === "es" ? "en" : "es" });
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 px-8 py-5 transition-all duration-500 ${
        scrolled
          ? // Con scroll: fondo difuminado oscuro-cálido
            "bg-bg-surface/80 backdrop-blur-xl border-b border-border-subtle shadow-[0_4px_30px_rgba(0,0,0,0.15)]"
          : // En el hero: completamente transparente
            "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="w-full flex items-center justify-between">

        {/* ── Izquierda: Toggle de idioma y tema ── */}
        <div className="w-36 flex items-center gap-4">
          <button
            onClick={toggleLocale}
            aria-label="Cambiar idioma"
            className="flex items-center gap-2 group cursor-pointer"
          >
            <svg
              className={`w-4 h-4 transition-colors ${scrolled ? "text-text-primary/60 group-hover:text-text-primary" : "text-text-primary/40 group-hover:text-text-primary/80"}`}
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
            <span className={`text-[10px] font-semibold tracking-[0.2em] uppercase transition-colors ${scrolled ? "text-text-primary/60 group-hover:text-text-primary" : "text-text-primary/40 group-hover:text-text-primary/80"}`}>
              {locale === "es" ? "EN" : "ES"}
            </span>
          </button>

          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Cambiar tema"
              className="flex items-center justify-center p-1.5 rounded-lg hover:bg-bg-surface transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className={`w-4 h-4 ${scrolled ? "text-text-primary/60 hover:text-text-primary" : "text-text-primary/40 hover:text-text-primary/80"}`} strokeWidth={1.8} />
              ) : (
                <Moon className={`w-4 h-4 ${scrolled ? "text-text-primary/60 hover:text-text-primary" : "text-text-primary/40 hover:text-text-primary/80"}`} strokeWidth={1.8} />
              )}
            </button>
          )}
        </div>

        {/* ── Centro: Logo con Syne (fuente display del proyecto) ── */}
        <Link href="/" className="flex items-center gap-3 group select-none">

          {/* Ícono SVG: caja/paquete minimalista */}
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"
            className={`transition-colors duration-500 shrink-0 ${
              scrolled ? "text-[#e8a043]" : "text-[#1abced]"
            }`}
          >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>

          {/* Texto LOOMBOX en Syne */}
          <span
            className={`transition-colors duration-300 ${
              scrolled ? "text-text-primary" : "text-text-primary/90 group-hover:text-text-primary"
            }`}
            style={{
              fontFamily:    "var(--font-syne), sans-serif",
              fontSize:      "clamp(1rem, 1.8vw, 1.25rem)",
              fontWeight:    700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              lineHeight:    1,
            }}
          >
            Loombox
          </span>
        </Link>

        {/* ── Derecha: Botón ingresar ── */}
        <div className="w-36 flex items-center justify-end">
          <Link
            href="/login"
            aria-label="Iniciar sesión"
            className={`flex items-center gap-2 transition-colors group ${scrolled ? "text-text-primary/60 hover:text-text-primary" : "text-text-primary/40 hover:text-text-primary"}`}
          >
            <User className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <span className="text-[10px] tracking-[0.2em] uppercase hidden sm:inline font-medium">
              {t('login')}
            </span>
          </Link>
        </div>

      </div>
    </nav>
  );
}
