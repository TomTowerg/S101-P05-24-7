"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function VerifyOTPClient({ email, role }: { email: string; role: string }) {
  const t = useTranslations("otp");
  const router = useRouter();

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [activeOTPIndex, setActiveOTPIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [errorStatus, setErrorStatus] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [shake, setShake] = useState(false);

  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Mask email
  const maskEmail = (e: string) => {
    const [name, domain] = e.split("@");
    if (!name || !domain) return e;
    return `${name.charAt(0)}***@${domain}`;
  };

  useEffect(() => {
    // Attempt sending OTP the first time component loads
    const initialSend = async () => {
      try {
        const res = await fetch("/api/auth/send-otp", { method: "POST" });
        if (res.ok) {
           setErrorStatus({ message: t("codeSent"), type: 'success' });
        }
      } catch (err) {}
    };
    initialSend();
  }, [t]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!canResend) {
      interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [canResend]);

  const handleResend = async () => {
    setCanResend(false);
    setCooldown(60);
    setErrorStatus(null);
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST" });
      if (res.ok) {
        setErrorStatus({ message: t("codeSent"), type: 'success' });
      } else {
        const data = await res.json();
        setErrorStatus({ message: data.error || "Error", type: 'error' });
      }
    } catch (e) {
      setErrorStatus({ message: "Network error", type: 'error' });
    }
  };

  const verifyCode = async (code: string) => {
    setIsLoading(true);
    setErrorStatus(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, trustDevice }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setErrorStatus({ message: t("success"), type: 'success' });
        router.refresh(); // Crucial to update JWT session state on the server components
        const dest = role === "CONSERJE" ? "/dashboard/conserje" : "/dashboard/resident";
        router.push(dest);
      } else {
        setOtp([...otp.map(() => "")]);
        setActiveOTPIndex(0);
        setShake(true);
        setTimeout(() => setShake(false), 500);

        let msg = data.error;
        if (data.error === "locked") {
          const unlockTime = new Date(data.lockoutUntil);
          const diffMins = Math.ceil((unlockTime.getTime() - Date.now()) / 60000);
          msg = t("lockedOut", { minutes: diffMins });
        } else if (data.error === "expired") {
          msg = t("expiredCode");
        } else {
          msg = t("invalidCode", { attempts: data.attemptsLeft });
        }
        setErrorStatus({ message: msg, type: 'error' });
      }
    } catch (e) {
      setErrorStatus({ message: "Network Error", type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (!value) return;

    const newOTP = [...otp];
    // Take only the last character in case they type fast
    newOTP[index] = value.substring(value.length - 1);
    setOtp(newOTP);

    const nextIndex = index + 1;
    if (nextIndex < 6) {
      setActiveOTPIndex(nextIndex);
    } else {
      // Full OTP entered
      setActiveOTPIndex(5); // Keep focus on last element
      const fullCode = newOTP.join("");
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOTP = [...otp];
      newOTP[index] = "";
      setOtp(newOTP);
      if (index > 0) setActiveOTPIndex(index - 1);
    }
  };

  const handleOnPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6).trim();
    if (/^\d+$/.test(pastedData)) {
      const newOTP = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOTP[i] = pastedData[i];
      }
      setOtp(newOTP);
      if (pastedData.length === 6) {
          setActiveOTPIndex(5);
          verifyCode(newOTP.join(""));
      } else {
          setActiveOTPIndex(pastedData.length);
      }
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeOTPIndex]);

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-8 space-y-8"
      >
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#606060] hover:text-white transition-colors text-[13px] cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {t("back")}
        </button>

        {/* Logo + title */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.6">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-white">{t("title")}</h1>
          <p className="text-[14px] text-[#A0A0A0] leading-relaxed">
            {t("subtitle", { email: maskEmail(email) })}
          </p>
        </div>

        {/* 6-digit input boxes */}
        <motion.div
          className="flex gap-3 justify-center"
          onPaste={handleOnPaste}
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              disabled={isLoading}
              ref={index === activeOTPIndex ? inputRef : null}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOnChange(e, index)}
              onKeyDown={(e) => handleOnKeyDown(e, index)}
              onFocus={() => setActiveOTPIndex(index)}
              className={`w-[52px] h-[60px] text-center text-[24px] font-bold text-white bg-[#262626] border rounded-xl outline-none transition-all
                ${activeOTPIndex === index
                  ? "border-[#6366F1] ring-2 ring-[#6366F1]/20"
                  : "border-white/[0.08]"}
                ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            />
          ))}
        </motion.div>

        {/* Status message */}
        <AnimatePresence mode="wait">
          {errorStatus && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center text-[13px] font-medium -mt-4 ${errorStatus.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}
            >
              {errorStatus.message}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Trust device */}
        <label className="flex items-center justify-center gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              disabled={isLoading}
            />
            <div className="w-5 h-5 bg-[#262626] border-2 border-white/[0.12] rounded peer-checked:bg-[#6366F1] peer-checked:border-[#6366F1] transition-colors peer-focus:ring-2 peer-focus:ring-[#6366F1]/30"></div>
            <svg className="absolute w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-[#A0A0A0] group-hover:text-white transition-colors">
            {t("trustDevice")}
          </span>
        </label>

        {/* Submit button */}
        <button
          onClick={() => verifyCode(otp.join(""))}
          disabled={isLoading || otp.join("").length < 6}
          className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full py-3 text-[15px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            t("verify")
          )}
        </button>

        {/* Resend link with timer */}
        <div className="text-center -mt-4">
          <button
            onClick={handleResend}
            disabled={!canResend || isLoading}
            className="text-[13px] text-[#606060] hover:text-[#A0A0A0] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[#606060]"
          >
            {canResend ? t("resend") : t("resendIn", { seconds: cooldown })}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
