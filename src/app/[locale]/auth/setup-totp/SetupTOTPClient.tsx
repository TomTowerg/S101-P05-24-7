"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function SetupTOTPClient({ role }: { email: string; role: string }) {
  const t = useTranslations("totp");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/totp-setup")
      .then((r) => r.json())
      .then((data) => {
        if (data.alreadyEnabled) {
          window.location.href = role === "CONSERJE" ? "/es/auth/verify-totp" : "/es/auth/verify-totp";
        } else {
          setQrCode(data.qrCode);
          setSecret(data.secret);
        }
      })
      .finally(() => setIsFetching(false));
  }, [role]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (!value) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (index + 1 < 6) {
      setActiveIndex(index + 1);
    } else if (newOtp.join("").length === 6) {
      handleVerify(newOtp.join(""));
    }
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
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/totp-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        const dest = role === "CONSERJE" ? "/es/dashboard/conserje" : "/es/dashboard/resident";
        window.location.href = dest;
      } else {
        setOtp(new Array(6).fill(""));
        setActiveIndex(0);
        setError(t("invalidCode"));
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm md:max-w-lg bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 px-4 md:px-8 py-6 md:py-8 rounded-3xl shadow-2xl"
      >
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
          <ShieldCheck className="text-indigo-400 w-8 h-8" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{t("setupTitle")}</h1>
          <p className="text-neutral-400 text-sm">{t("setupSubtitle")}</p>
        </div>

        {isFetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-indigo-400 w-8 h-8" />
          </div>
        ) : (
          <>
            {qrCode && (
              <div className="mb-8">
                <p className="text-sm text-neutral-400 text-center mb-4">{t("scanInstructions")}</p>
                <div className="bg-white rounded-2xl p-3 md:p-4 w-fit mx-auto">
                  <Image src={qrCode} alt="TOTP QR Code" width={256} height={256} className="w-40 h-40 md:w-56 md:h-56" />
                </div>
                {secret && (
                  <p className="text-xs text-neutral-600 text-center mt-3 font-mono break-all">
                    {secret}
                  </p>
                )}
              </div>
            )}

            <p className="text-sm text-neutral-300 text-center mb-4">{t("enterCode")}</p>

            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {otp.map((_, index) => (
                <input
                  key={index}
                  ref={index === activeIndex ? inputRef : null}
                  type="number"
                  disabled={isLoading}
                  className={`w-10 h-12 md:w-12 md:h-14 text-center text-lg md:text-xl font-semibold bg-neutral-950 text-white rounded-xl border-2 transition-all outline-none
                    ${activeIndex === index ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "border-neutral-800"}
                    ${otp[index] ? "border-neutral-700 bg-neutral-900" : ""}
                    ${isLoading ? "opacity-50" : ""}
                  `}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={() => setActiveIndex(index)}
                  value={otp[index]}
                  maxLength={1}
                />
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-sm text-center mb-4"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              onClick={() => handleVerify(otp.join(""))}
              disabled={isLoading || otp.join("").length < 6}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <span>{t("enable")}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
