"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function SetupTOTPClient({ role }: { email: string; role: string }) {
  const t      = useTranslations("totp");
  const locale = useLocale();

  const [qrCode, setQrCode]       = useState<string | null>(null);
  const [secret, setSecret]       = useState<string | null>(null);
  const [otp, setOtp]             = useState<string[]>(new Array(6).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [verified, setVerified]   = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Space canvas (stars only — no sphere for setup page) ────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const CW = canvas.offsetWidth, CH = canvas.offsetHeight;
    canvas.width = CW * dpr; canvas.height = CH * dpr;
    ctx.scale(dpr, dpr);

    const stars = Array.from({ length: 280 }, () => ({
      x: Math.random() * CW, y: Math.random() * CH,
      r: Math.random() * 1.2 + 0.2, o: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.015 + 0.003, phase: Math.random() * Math.PI * 2,
    }));

    let raf: number, tick = 0;
    const draw = () => {
      tick += 0.016;
      ctx.fillStyle = "rgb(4, 2, 12)";
      ctx.fillRect(0, 0, CW, CH);
      stars.forEach((s) => {
        const alpha = s.o * (0.4 + 0.6 * Math.sin(tick * s.speed * 60 + s.phase));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── Fetch QR ────────────────────────────────────────────────────── */
  useEffect(() => {
    fetch("/api/auth/totp-setup")
      .then((r) => r.json())
      .then((data) => {
        if (data.alreadyEnabled) {
          window.location.href = `/${locale}/auth/verify-totp`;
        } else {
          setQrCode(data.qrCode);
          setSecret(data.secret);
        }
      })
      .finally(() => setIsFetching(false));
  }, [locale, role]);

  useEffect(() => {
    inputRefs.current[activeIndex]?.focus();
  }, [activeIndex]);

  /* ── Handlers ────────────────────────────────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!val || !/\d/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (index + 1 < 6) setActiveIndex(index + 1);
    else if (newOtp.join("").length === 6) handleVerify(newOtp.join(""));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      if (index > 0) setActiveIndex(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").slice(0, 6).trim();
    if (/^\d+$/.test(pasted)) {
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
      setOtp(newOtp);
      if (pasted.length === 6) handleVerify(newOtp.join(""));
      else setActiveIndex(pasted.length);
    }
  };

  const handleVerify = async (code: string) => {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/totp-setup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        setVerified(true);
        setTimeout(() => {
          window.location.href = role === "CONSERJE"
            ? `/${locale}/dashboard/conserje`
            : `/${locale}/dashboard/resident`;
        }, 900);
      } else {
        setOtp(new Array(6).fill("")); setActiveIndex(0);
        setError(t("invalidCode"));
      }
    } catch { setError("Network error"); }
    finally { setIsLoading(false); }
  };

  const boxClass = (index: number) => {
    const base = "w-[46px] h-[54px] text-center text-[22px] font-bold text-white rounded-xl outline-none transition-all duration-200 border-2 bg-white/[0.05] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ";
    if (verified)          return base + "border-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.5)]";
    if (error)             return base + "border-red-500/70";
    if (activeIndex === index) return base + "border-[#6366F1] shadow-[0_0_12px_rgba(99,102,241,0.4)]";
    if (otp[index])        return base + "border-white/20";
    return base + "border-white/[0.08]";
  };

  return (
    <div className="fixed inset-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[660px]"
          style={{
            background: "rgba(8,8,20,0.72)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "22px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Header */}
          <div className="text-center px-8 pt-8 pb-6 border-b border-white/[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Loombox" width={48} height={48}
              style={{ width: 48, height: 48, objectFit: "contain", margin: "0 auto 14px" }} />
            <h1 className="text-[24px] font-bold text-white" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
              {t("setupTitle")}
            </h1>
            <p className="text-[13px] text-white/40 mt-1">{t("setupSubtitle")}</p>
          </div>

          {isFetching ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-[#6366F1] w-8 h-8" />
            </div>
          ) : (
            <div className="p-8 space-y-8">
              {/* Two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* LEFT: Steps */}
                <div className="space-y-5">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.25em]">
                    {t("stepsLabel")}
                  </p>
                  {[
                    { num: 1, title: t("step1Title"), desc: t("step1Desc") },
                    { num: 2, title: t("step2Title"), desc: t("step2Desc") },
                    { num: 3, title: t("step3Title"), desc: t("step3Desc") },
                  ].map((step) => (
                    <div key={step.num} className="flex gap-4">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
                        <span className="text-[13px] font-bold text-[#818CF8]">{step.num}</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-white">{step.title}</p>
                        <p className="text-[12px] text-white/35 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* RIGHT: QR */}
                <div className="flex flex-col items-center gap-4">
                  {qrCode && (
                    <div className="bg-white rounded-2xl p-4 shadow-lg">
                      <Image src={qrCode} alt="TOTP QR Code" width={200} height={200} className="w-[150px] h-[150px]" />
                    </div>
                  )}
                  {secret && (
                    <div className="w-full">
                      <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-2 text-center">{t("manualKey")}</p>
                      <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <code className="text-[12px] font-mono text-white/50 flex-1 break-all">{secret}</code>
                        <button onClick={() => navigator.clipboard.writeText(secret)}
                          className="shrink-0 text-[#818CF8] hover:text-white transition-colors cursor-pointer" aria-label="Copy">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OTP input */}
              <div className="space-y-3">
                <p className="text-[12px] text-white/40 text-center uppercase tracking-[0.2em]">{t("enterCode")}</p>
                <motion.div
                  className="flex justify-center gap-2.5"
                  animate={error ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                  onPaste={handlePaste}
                >
                  {otp.map((digit, index) => (
                    <input key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="number" inputMode="numeric"
                      disabled={isLoading || verified}
                      className={boxClass(index)}
                      onChange={(e) => handleChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onFocus={() => setActiveIndex(index)}
                      value={digit} maxLength={1}
                    />
                  ))}
                </motion.div>
              </div>

              <AnimatePresence>
                {verified && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[13px] text-emerald-400 text-center">
                    {t("codeVerified")}
                  </motion.p>
                )}
                {error && (
                  <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-[13px] text-red-400 text-center -mt-4">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
