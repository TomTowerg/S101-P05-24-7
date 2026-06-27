"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useState, useEffect, CSSProperties } from "react";
import {
  Check,
  Package,
  Smartphone,
  ClipboardList,
  Building2,
  ScanLine,
  Bell,
  QrCode,
  ShieldCheck,
  BarChart3,
  ArrowRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────
   Hook: dispara una vez cuando el elemento entra
   al viewport. Se desconecta tras el primer trigger.
───────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* Helper: estilos de entrada escalonada ──────── */
function fadeUp(
  active: boolean,
  delay = 0,
  extra?: CSSProperties
): CSSProperties {
  return {
    opacity: active ? 1 : 0,
    transform: active ? "translateY(0)" : "translateY(28px)",
    transition: "opacity 0.7s ease, transform 0.7s ease",
    transitionDelay: `${delay}ms`,
    ...extra,
  };
}

function fadeRight(active: boolean, delay = 0): CSSProperties {
  return {
    opacity: active ? 1 : 0,
    transform: active ? "translateX(0)" : "translateX(24px)",
    transition: "opacity 0.8s ease, transform 0.8s ease",
    transitionDelay: `${delay}ms`,
  };
}

export default function Home() {
  const t = useTranslations("Home");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  /* Refs de sección para scroll-trigger */
  const { ref: statsRef, inView: statsInView } = useInView();
  const { ref: howRef, inView: howInView } = useInView();
  const { ref: rolesRef, inView: rolesInView } = useInView();
  const { ref: benefitsRef, inView: benefitsInView } = useInView();
  const { ref: ctaRef, inView: ctaInView } = useInView();

  /* Datos desde i18n */
  const STATS = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
  ];

  const STEPS = [
    { number: "01", icon: ScanLine, title: t("step1Title"), desc: t("step1Desc") },
    { number: "02", icon: Bell,     title: t("step2Title"), desc: t("step2Desc") },
    { number: "03", icon: QrCode,   title: t("step3Title"), desc: t("step3Desc") },
  ];

  const ROLES = [
    {
      role: "CONSERJE",
      accent: "#f59e0b",
      icon: Package,
      label: t("conciergeLabel"),
      headline: t("conciergeHeadline"),
      features: [t("conciergeF1"), t("conciergeF2"), t("conciergeF3"), t("conciergeF4")],
      cta: t("conciergeCta"),
    },
    {
      role: "RESIDENTE",
      accent: "#fcd34d",
      icon: Building2,
      label: t("residentLabel"),
      headline: t("residentHeadline"),
      features: [t("residentF1"), t("residentF2"), t("residentF3"), t("residentF4")],
      cta: t("residentCta"),
    },
  ];

  const BENEFITS = [
    { icon: BarChart3,   title: t("benefit1Title"), desc: t("benefit1Desc") },
    { icon: ShieldCheck, title: t("benefit2Title"), desc: t("benefit2Desc") },
    { icon: Smartphone,  title: t("benefit3Title"), desc: t("benefit3Desc") },
  ];

  const FEATURES = [
    { icon: Package,       label: t("feat1") },
    { icon: Smartphone,    label: t("feat2") },
    { icon: ClipboardList, label: t("feat3") },
    { icon: ShieldCheck,   label: t("feat4") },
  ];

  return (
    <div className="-mt-16 w-full font-sans bg-bg-base text-text-primary selection:bg-[#f59e0b] selection:text-[#09090b] overflow-x-hidden transition-theme">

      {/* ══════════════════════════════════════
          SECCIÓN 1 — HERO
      ══════════════════════════════════════ */}
      <section className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mockups/fondo_1920_x_1080_3.png"
            alt=""
            className="w-full h-full"
            style={{
              objectFit: "cover",
              objectPosition: "center top",
              filter: "brightness(0.9) contrast(1.1) saturate(1.15)",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/95 via-[#09090b]/50 to-[#09090b]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/40 via-transparent to-transparent" />
        </div>

        <div className="relative z-20 w-full h-screen">

          {/* ── Texto principal ── */}
          <div className="absolute bottom-[28%] left-[5%] md:left-[7%] max-w-lg">

            {/* Eyebrow: tracking-expand — comprimido+blur → espaciado */}
            <p
              className={`text-[#fcd34d] text-xs font-semibold uppercase mb-4 ${mounted ? "animate-tracking-expand" : "opacity-0"}`}
              style={{ animationDelay: "0.12s" }}
            >
              {t("eyebrow")}
            </p>

            {/* Título */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-light tracking-[0.1em] text-[#fafafa] uppercase leading-[1.1] mb-5 drop-shadow-lg"
              style={fadeUp(mounted, 220)}
            >
              {t("heroTitle1")}<br />
              <span className="font-bold">{t("heroTitle2")}</span>
            </h1>

            {/* Descripción */}
            <p
              className="text-sm md:text-base text-text-primary/70 font-light leading-relaxed mb-8 max-w-sm"
              style={fadeUp(mounted, 380)}
            >
              {t("heroDesc")}
            </p>

            {/* CTA con glow pulsante */}
            <div style={fadeUp(mounted, 500)}>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2.5 bg-[#f59e0b] hover:bg-[#d97706] active:scale-95 text-[#09090b] px-8 py-3.5 rounded-full text-xs font-bold tracking-[0.2em] transition-colors duration-200 uppercase animate-amber-pulse"
              >
                <ArrowRight className="w-4 h-4" />
                {t("heroCta")}
              </Link>
            </div>
          </div>

          {/* ── Feature list ── */}
          <div
            className="absolute bottom-5 left-[5%] md:left-[7%] pointer-events-none"
            style={fadeUp(mounted, 680)}
          >
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {FEATURES.map(({ icon: Icon, label }, i) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-text-primary/50"
                  style={fadeUp(mounted, 700 + i * 80)}
                >
                  <Check className="w-3 h-3 text-[#f59e0b] shrink-0" strokeWidth={3} />
                  <Icon className="w-3 h-3 text-text-primary/30 shrink-0" strokeWidth={1.5} />
                  <span className="text-[11px] tracking-wide font-light">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Widget acceso rápido (entra desde la derecha) ── */}
          <div
            className="absolute bottom-5 right-[5%] md:right-[7%] pointer-events-auto"
            style={fadeRight(mounted, 750)}
          >
            <Link
              href="/login?role=CONSERJE"
              className="bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 hover:border-[#f59e0b]/40 p-4 pr-10 rounded-2xl flex items-center gap-3 transition-all duration-300 group relative"
            >
              <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center border border-[#f59e0b]/20 group-hover:bg-[#f59e0b]/20 transition-colors duration-300">
                <ScanLine className="w-5 h-5 text-[#f59e0b]" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-text-primary/40 text-[10px] font-light tracking-widest uppercase">{t("quickAccessLabel")}</span>
                <span className="text-text-primary/90 font-semibold text-xs">{t("quickAccessBtn")}</span>
              </div>
              <ArrowRight className="absolute right-3 w-3.5 h-3.5 text-text-primary/30 group-hover:text-[#f59e0b] group-hover:translate-x-0.5 transition-all duration-300" />
            </Link>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════
          SECCIÓN 2 — ESTADÍSTICAS
      ══════════════════════════════════════ */}
      <section className="relative z-10 border-t border-border-subtle bg-bg-surface transition-theme">
        <div
          ref={statsRef}
          className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
        >
          {STATS.map(({ value, label }, i) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2"
              style={fadeUp(statsInView, i * 120)}
            >
              <span className="text-3xl md:text-4xl font-bold text-[#f59e0b]">{value}</span>
              <span className="text-xs text-text-muted tracking-wide max-w-[180px] leading-relaxed">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECCIÓN 3 — CÓMO FUNCIONA
      ══════════════════════════════════════ */}
      <section id="como-funciona" className="bg-bg-base py-24 px-6 border-t border-border-subtle transition-theme">
        <div className="max-w-5xl mx-auto" ref={howRef}>

          {/* Título */}
          <div className="text-center mb-16" style={fadeUp(howInView, 0)}>
            <p className="text-[#f59e0b] text-xs font-semibold tracking-[0.3em] uppercase mb-3">
              {t("howEyebrow")}
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-text-primary tracking-wide">
              {t("howTitle1")} <span className="font-bold">{t("howTitle2")}</span>?
            </h2>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">

            {/* Línea que se "dibuja" de izquierda a derecha */}
            <div
              className="hidden md:block absolute top-10 left-[17%] right-[17%] h-px bg-gradient-to-r from-[#f59e0b]/20 via-[#f59e0b]/50 to-[#f59e0b]/20"
              style={{
                transformOrigin: "left",
                transform: howInView ? "scaleX(1)" : "scaleX(0)",
                transition: "transform 1.1s ease 0.35s",
              }}
            />

            {STEPS.map(({ number, icon: Icon, title, desc }, i) => (
              <div
                key={number}
                className="relative flex flex-col items-center text-center group"
                style={fadeUp(howInView, 200 + i * 150)}
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-bg-surface border border-border-subtle group-hover:border-[#f59e0b]/30 flex items-center justify-center transition-all duration-500 shadow-lg group-hover:shadow-[0_0_24px_rgba(245,158,11,0.1)]">
                    <Icon
                      className="w-8 h-8 text-[#f59e0b]/60 group-hover:text-[#f59e0b] transition-all duration-500 group-hover:scale-110"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="absolute -top-3 -right-3 text-[10px] font-black text-[#f59e0b]/40 tracking-widest">
                    {number}
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary mb-3 tracking-wide">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECCIÓN 4 — PARA QUIÉN ES
      ══════════════════════════════════════ */}
      <section id="para-quien" className="bg-bg-surface py-24 px-6 border-t border-border-subtle transition-theme">
        <div className="max-w-5xl mx-auto" ref={rolesRef}>

          {/* Título */}
          <div className="text-center mb-16" style={fadeUp(rolesInView, 0)}>
            <p className="text-[#fcd34d] text-xs font-semibold tracking-[0.3em] uppercase mb-3">
              {t("rolesEyebrow")}
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-text-primary tracking-wide">
              {t("rolesTitle1")} <span className="font-bold">{t("rolesTitle2")}</span>
            </h2>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROLES.map(({ role, accent, icon: Icon, label, headline, features, cta }, i) => (
              <div
                key={role}
                className="relative bg-bg-surface border border-border-subtle hover:border-text-primary/15 rounded-2xl p-8 flex flex-col gap-6 transition-all duration-500 group overflow-hidden"
                style={fadeUp(rolesInView, 150 + i * 160)}
              >
                {/* Glow ambiental */}
                <div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] opacity-[0.08] group-hover:opacity-[0.18] transition-opacity duration-500"
                  style={{ backgroundColor: accent }}
                />

                {/* Header */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-105"
                    style={{ backgroundColor: `${accent}10`, borderColor: `${accent}25` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: accent }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: accent }}>
                      {label}
                    </p>
                    <h3 className="text-lg font-bold text-text-primary leading-tight">{headline}</h3>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {features.map((f, fi) => (
                    <li
                      key={f}
                      className="flex items-start gap-3"
                      style={fadeUp(rolesInView, 250 + i * 160 + fi * 60)}
                    >
                      <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} strokeWidth={2.5} />
                      <span className="text-sm text-text-muted">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={`/login?role=${role}`}
                  className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all duration-300 group/btn w-fit"
                  style={{ color: accent }}
                >
                  {cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECCIÓN 5 — BENEFICIOS
      ══════════════════════════════════════ */}
      <section className="bg-bg-base py-24 px-6 border-t border-border-subtle transition-theme">
        <div className="max-w-5xl mx-auto" ref={benefitsRef}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="flex flex-col gap-4 group"
                style={fadeUp(benefitsInView, i * 130)}
              >
                <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border-subtle group-hover:border-[#f59e0b]/30 flex items-center justify-center transition-all duration-400 group-hover:bg-[#f59e0b]/5">
                  <Icon
                    className="w-5 h-5 text-[#f59e0b] transition-transform duration-400 group-hover:scale-110"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-base font-bold text-text-primary">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECCIÓN 6 — CTA FINAL
      ══════════════════════════════════════ */}
      <section className="bg-bg-surface border-t border-border-subtle py-24 px-6 transition-theme">
        <div
          ref={ctaRef}
          className="max-w-2xl mx-auto text-center flex flex-col items-center gap-8"
        >
          {/* Ícono flotante */}
          <div
            className="w-16 h-16 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center animate-float"
            style={fadeUp(ctaInView, 0)}
          >
            <Package className="w-8 h-8 text-[#f59e0b]" strokeWidth={1.5} />
          </div>

          {/* Texto */}
          <div style={fadeUp(ctaInView, 120)}>
            <h2 className="text-3xl md:text-4xl font-light text-text-primary tracking-wide mb-4">
              {t("ctaTitle1")}<br />
              <span className="font-bold">{t("ctaTitle2")}</span>
            </h2>
            <p className="text-text-muted text-sm leading-relaxed">
              {t("ctaDesc")}
            </p>
          </div>

          {/* Botones */}
          <div
            className="flex flex-col sm:flex-row gap-4"
            style={fadeUp(ctaInView, 240)}
          >
            <Link
              href="/login?role=CONSERJE"
              className="inline-flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#d97706] active:scale-95 text-[#09090b] px-8 py-3.5 rounded-full text-xs font-bold tracking-widest transition-all duration-200 uppercase animate-amber-pulse cursor-pointer"
            >
              <Package className="w-4 h-4" /> {t("ctaConserje")}
            </Link>
            <Link
              href="/login?role=RESIDENTE"
              className="inline-flex items-center justify-center gap-2 bg-bg-base hover:bg-bg-surface border border-border-subtle hover:border-text-primary/20 text-text-primary px-8 py-3.5 rounded-full text-xs font-bold tracking-widest transition-all duration-200 uppercase cursor-pointer"
            >
              <Building2 className="w-4 h-4" /> {t("ctaResidente")}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-bg-base border-t border-border-subtle py-8 px-6 transition-theme">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-text-primary/30 text-xs">
          <p>© {new Date().getFullYear()} Loombox. {t("footerRights")}</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-text-primary transition-colors duration-300">
              {t("footerLogin")}
            </Link>
            <span className="text-text-primary/10">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
