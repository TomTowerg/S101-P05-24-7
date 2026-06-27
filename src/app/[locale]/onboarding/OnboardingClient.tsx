"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, Building2, X } from "lucide-react";
import EmptyState from "@/components/EmptyState";

type Role = "CONSERJE" | "RESIDENTE";

interface Apartment {
  id: string;
  number: string;
  tower: string | null;
}

export default function OnboardingClient({
  apartments,
  initialRole,
}: {
  apartments: Apartment[];
  initialRole: string;
}) {
  const t      = useTranslations("onboarding");
  const locale = useLocale();
  const { update, data: sessionData } = useSession();
  const role = initialRole as Role;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // CONSERJE skips apartment selection → start at confirmation (step 3)
  // RESIDENTE starts at apartment selection (step 2)
  const [step, setStep] = useState<2 | 3>(role === "CONSERJE" ? 3 : 2);
  const [apartmentId, setApartmentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasSubmitted = useRef(false);

  /* ── Stars canvas ──────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const CW = canvas.offsetWidth, CH = canvas.offsetHeight;
    canvas.width = CW * dpr; canvas.height = CH * dpr;
    ctx.scale(dpr, dpr);
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * CW, y: Math.random() * CH,
      r: Math.random() * 1.1 + 0.2, o: Math.random() * 0.55 + 0.1,
      speed: Math.random() * 0.015 + 0.003, phase: Math.random() * Math.PI * 2,
    }));
    let raf: number, tick = 0;
    const draw = () => {
      tick += 0.016;
      ctx.fillStyle = "rgb(4,2,12)"; ctx.fillRect(0, 0, CW, CH);
      stars.forEach((s) => {
        const a = s.o * (0.4 + 0.6 * Math.sin(tick * s.speed * 60 + s.phase));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Notify concierge modal state
  const [showNotify, setShowNotify] = useState(false);
  const [notifyForm, setNotifyForm] = useState({ name: "", email: "", message: "" });
  const [isNotifying, setIsNotifying] = useState(false);
  const [notifySent, setNotifySent] = useState(false);

  const openNotifyModal = () => {
    setNotifyForm({
      name: sessionData?.user?.name || "",
      email: sessionData?.user?.email || "",
      message: "",
    });
    setShowNotify(true);
  };

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNotifying(true);
    try {
      const res = await fetch("/api/notify-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifyForm),
      });
      if (res.ok) {
        setNotifySent(true);
      }
    } catch {
      // silent fail
    } finally {
      setIsNotifying(false);
    }
  };

  const handleComplete = async () => {
    if (isLoading || hasSubmitted.current) return;
    hasSubmitted.current = true;
    setIsLoading(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, apartmentId: role === "RESIDENTE" ? apartmentId : null }),
      });
      if (res.ok) {
        await update({ onboardingComplete: true });
        toast.success(t("onboardingComplete"));
        const dest = role === "CONSERJE" ? `/${locale}/dashboard/conserje` : `/${locale}/dashboard/resident`;
        window.location.href = dest;
      } else {
        toast.error(t("errorOnboarding"));
        hasSubmitted.current = false;
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al completar el registro. Intenta nuevamente.");
      hasSubmitted.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  // Progress display:
  // CONSERJE:  1/1 (straight to confirmation)
  // RESIDENTE: step 2 → 1/2, step 3 → 2/2
  const currentStepDisplay = role === "CONSERJE" ? 1 : step - 1;
  const totalStepsDisplay = role === "CONSERJE" ? 1 : 2;

  const steps =
    role === "CONSERJE"
      ? [{ label: t("step3.title"), desc: t("step3.subtitle") }]
      : [
          { label: t("step2.title"), desc: t("apartment") },
          { label: t("step3.title"), desc: t("step3.subtitle") },
        ];

  return (
    <div className="min-h-screen flex relative">
      {/* Space background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* LEFT PANEL — branding + step indicator */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative border-r border-white/[0.05]"
        style={{ background: "rgba(6,3,18,0.6)", backdropFilter: "blur(2px)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] bg-[#6366F1]/[0.06] rounded-full blur-[90px]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Loombox" width={30} height={30}
            style={{ width: 30, height: 30, objectFit: "contain" }} />
          <span
            style={{ fontFamily: "var(--font-syne, sans-serif)", fontWeight: 700, letterSpacing: "0.12em", fontSize: "18px" }}
            className="text-white uppercase"
          >
            Loombox
          </span>
        </div>

        {/* Step indicator */}
        <div className="relative space-y-6">
          <p className="text-[11px] font-semibold text-[#606060] uppercase tracking-widest">
            {t("progress", { current: currentStepDisplay, total: totalStepsDisplay })}
          </p>

          {/* Progress bar */}
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden w-48">
            <motion.div
              className="h-full bg-[#6366F1] rounded-full"
              initial={{ width: `${(1 / totalStepsDisplay) * 100}%` }}
              animate={{ width: `${(currentStepDisplay / totalStepsDisplay) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Steps list */}
          <div className="space-y-4">
            {steps.map((s, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === currentStepDisplay;
              const isDone = stepNum < currentStepDisplay;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                      isDone
                        ? "bg-[#6366F1]/20 border border-[#6366F1]/30"
                        : isActive
                        ? "bg-[#6366F1]"
                        : "bg-white/[0.04] border border-white/[0.08]"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-4 h-4 text-[#6366F1]" />
                    ) : (
                      <span className={`text-[12px] font-bold ${isActive ? "text-white" : "text-[#606060]"}`}>
                        {stepNum}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className={`text-[14px] font-medium transition-colors duration-300 ${isActive || isDone ? "text-white" : "text-[#606060]"}`}>
                      {s.label}
                    </p>
                    <p className="text-[12px] text-[#606060]">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-[12px] text-[#606060]">TICS420 — 2026</p>
      </div>

      {/* RIGHT PANEL — form */}
      <div className="flex-1 flex items-center justify-center p-8 relative"
        style={{ background: "rgba(10,6,28,0.55)", backdropFilter: "blur(1px)" }}>
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Loombox" width={24} height={24}
              style={{ width: 24, height: 24, objectFit: "contain" }} />
            <span className="text-white font-bold text-sm tracking-widest uppercase">Loombox</span>
          </div>

          <AnimatePresence mode="wait">
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                {/* Step title */}
                <div>
                  <p className="text-[11px] font-semibold text-[#6366F1] uppercase tracking-widest mb-2">
                    {t("title")}
                  </p>
                  <h1 className="text-[28px] font-bold text-white mb-2">{t("step2.title")}</h1>
                  <p className="text-[15px] text-[#A0A0A0]">{t("subtitle")}</p>
                </div>

                {/* Apartment select */}
                {apartments.length === 0 ? (
                  <EmptyState
                    icon={Building2}
                    title={t("step2.noApartments")}
                  />
                ) : (
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-[#A0A0A0]">
                      {t("apartment")}
                    </label>
                    <select
                      value={apartmentId}
                      onChange={(e) => setApartmentId(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-[#6366F1]/50 transition-colors appearance-none cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                    >
                      <option value="" disabled>{t("step2.placeholder")}</option>
                      {apartments.map((apt) => (
                        <option key={apt.id} value={apt.id}>
                          {apt.number} {apt.tower ? `(${t("tower")} ${apt.tower})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Can't find depto link */}
                <p className="text-[13px] text-[#606060]">
                  <button
                    type="button"
                    onClick={openNotifyModal}
                    className="text-[#6366F1] hover:text-[#4F46E5] transition-colors underline-offset-2 hover:underline cursor-pointer"
                  >
                    {t("findAptLink")}
                  </button>
                </p>

                {/* Continue button */}
                <button
                  disabled={!apartmentId}
                  onClick={() => setStep(3)}
                  className="w-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full px-6 py-3.5 text-[15px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {t("continue")}
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                {/* Step title */}
                <div>
                  <p className="text-[11px] font-semibold text-[#6366F1] uppercase tracking-widest mb-2">
                    {t("title")}
                  </p>
                  <h1 className="text-[28px] font-bold text-white mb-2">{t("step3.title")}</h1>
                  <p className="text-[15px] text-[#A0A0A0]">{t("step3.subtitle")}</p>
                </div>

                {/* Confirmation card */}
                <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-[#6366F1]" />
                    </div>
                    <p className="text-[13px] font-semibold text-white">{t("step3.title")}</p>
                  </div>
                  <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                    <div>
                      <span className="text-[11px] text-[#606060] block uppercase tracking-widest mb-0.5">{t("role")}</span>
                      <span className="text-[14px] text-white font-medium">
                        {role === "CONSERJE" ? t("step1.concierge") : t("step1.resident")}
                      </span>
                    </div>
                    {role === "RESIDENTE" && (
                      <div>
                        <span className="text-[11px] text-[#606060] block uppercase tracking-widest mb-0.5">{t("apartment")}</span>
                        <span className="text-[14px] text-white font-medium">
                          {apartments.find((a) => a.id === apartmentId)?.number}
                          {apartments.find((a) => a.id === apartmentId)?.tower
                            ? ` (${t("tower")} ${apartments.find((a) => a.id === apartmentId)?.tower})`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-4">
                  {role === "RESIDENTE" ? (
                    <button
                      onClick={() => setStep(2)}
                      className="text-[#A0A0A0] hover:text-white px-4 py-2 text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-40"
                      disabled={isLoading}
                    >
                      {t("back")}
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full px-6 py-3.5 text-[15px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <span>{t("step3.cta")}</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Notify Concierge Modal */}
      {showNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            {notifySent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-[#6366F1]" />
                </div>
                <h3 className="text-white font-bold text-lg">{t("notifySuccessTitle")}</h3>
                <p className="text-[#A0A0A0] text-sm">{t("notifySuccessDesc")}</p>
                <button
                  onClick={() => { setShowNotify(false); setNotifySent(false); }}
                  className="mt-4 px-6 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full text-[14px] font-semibold transition-colors cursor-pointer"
                >
                  {t("notifyCloseButton")}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">{t("notifyModalTitle")}</h3>
                  <button
                    onClick={() => setShowNotify(false)}
                    className="text-[#606060] hover:text-white transition-colors cursor-pointer p-1"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-[#A0A0A0] text-sm mb-5">{t("notifyModalDesc")}</p>
                <form onSubmit={handleNotify} className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#A0A0A0] mb-1.5">{t("notifyNameLabel")}</label>
                    <input
                      type="text"
                      required
                      value={notifyForm.name}
                      onChange={e => setNotifyForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-[#262626] border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#A0A0A0] mb-1.5">{t("notifyEmailLabel")}</label>
                    <input
                      type="email"
                      required
                      value={notifyForm.email}
                      onChange={e => setNotifyForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-[#262626] border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#A0A0A0] mb-1.5">{t("notifyMessageLabel")}</label>
                    <textarea
                      required
                      rows={3}
                      placeholder={t("notifyMessagePlaceholder")}
                      value={notifyForm.message}
                      onChange={e => setNotifyForm(p => ({ ...p, message: e.target.value }))}
                      className="w-full bg-[#262626] border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/20 transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isNotifying}
                    className="w-full flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white py-3 rounded-full text-[14px] font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {isNotifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {t("notifySendButton")}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
