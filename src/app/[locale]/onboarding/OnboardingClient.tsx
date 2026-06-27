"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight, Loader2, Building2, X } from "lucide-react";
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
  const t = useTranslations("onboarding");
  const { update, data: sessionData } = useSession();
  const role = initialRole as Role;

  // CONSERJE skips apartment selection → start at confirmation (step 3)
  // RESIDENTE starts at apartment selection (step 2)
  const [step, setStep] = useState<2 | 3>(role === "CONSERJE" ? 3 : 2);
  const [apartmentId, setApartmentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasSubmitted = useRef(false);

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
        const dest = role === "CONSERJE" ? "/es/dashboard/conserje" : "/es/dashboard/resident";
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

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center pt-20 px-4">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
          <p className="text-neutral-400">{t("subtitle")}</p>
        </div>
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-neutral-400 font-medium">
              {t("progress", { current: currentStepDisplay, total: totalStepsDisplay })}
            </span>
            <span className="text-sm font-medium text-indigo-400">
              {Math.round((currentStepDisplay / totalStepsDisplay) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-600 rounded-full"
              initial={{ width: `${(1 / totalStepsDisplay) * 100}%` }}
              animate={{ width: `${(currentStepDisplay / totalStepsDisplay) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 md:p-10 shadow-2xl overflow-hidden relative">
          <AnimatePresence mode="wait">
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-white text-center mb-8">{t("step2.title")}</h2>
                {apartments.length === 0 ? (
                  <EmptyState
                    icon={Building2}
                    title={t("step2.noApartments")}
                  />
                ) : (
                  <div className="max-w-md mx-auto">
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      {t("apartment")}
                    </label>
                    <select
                      value={apartmentId}
                      onChange={(e) => setApartmentId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="" disabled>{t("step2.placeholder")}</option>
                      {apartments.map((apt) => (
                        <option key={apt.id} value={apt.id}>
                          {apt.number} {apt.tower ? `(${t("tower")} ${apt.tower})` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 text-center">
                      <button
                        type="button"
                        onClick={openNotifyModal}
                        className="text-xs text-neutral-400 hover:text-indigo-400 underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        {t("findAptLink")}
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-8 flex justify-end">
                  <button
                    disabled={!apartmentId}
                    onClick={() => setStep(3)}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{t("continue")}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">{t("step3.title")}</h2>
                <p className="text-neutral-400 mb-8">{t("step3.subtitle")}</p>
                <div className="bg-neutral-950 rounded-xl p-6 mb-8 max-w-sm mx-auto text-left border border-neutral-800">
                  <div className="mb-4">
                    <span className="text-sm text-neutral-500 block">{t("role")}</span>
                    <span className="text-white font-medium">
                      {role === "CONSERJE" ? t("step1.concierge") : t("step1.resident")}
                    </span>
                  </div>
                  {role === "RESIDENTE" && (
                    <div>
                      <span className="text-sm text-neutral-500 block">{t("apartment")}</span>
                      <span className="text-white font-medium">
                        {apartments.find((a) => a.id === apartmentId)?.number}
                        {apartments.find((a) => a.id === apartmentId)?.tower
                          ? ` (${t("tower")} ${apartments.find((a) => a.id === apartmentId)?.tower})`
                          : ""}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between max-w-sm mx-auto items-center">
                  {role === "RESIDENTE" ? (
                    <button
                      onClick={() => setStep(2)}
                      className="text-neutral-400 hover:text-white px-4 py-2 font-medium transition-colors cursor-pointer"
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
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={18} />
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

      {/* ── Notify Concierge Modal ── */}
      {showNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md"
          >
            {notifySent ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                <h3 className="text-white font-bold text-lg">{t("notifySuccessTitle")}</h3>
                <p className="text-neutral-400 text-sm">{t("notifySuccessDesc")}</p>
                <button
                  onClick={() => { setShowNotify(false); setNotifySent(false); }}
                  className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  {t("notifyCloseButton")}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">{t("notifyModalTitle")}</h3>
                  <button onClick={() => setShowNotify(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
                <p className="text-neutral-400 text-sm mb-4">{t("notifyModalDesc")}</p>
                <form onSubmit={handleNotify} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">{t("notifyNameLabel")}</label>
                    <input
                      type="text"
                      required
                      value={notifyForm.name}
                      onChange={e => setNotifyForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">{t("notifyEmailLabel")}</label>
                    <input
                      type="email"
                      required
                      value={notifyForm.email}
                      onChange={e => setNotifyForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">{t("notifyMessageLabel")}</label>
                    <textarea
                      required
                      rows={3}
                      placeholder={t("notifyMessagePlaceholder")}
                      value={notifyForm.message}
                      onChange={e => setNotifyForm(p => ({ ...p, message: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isNotifying}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
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
