"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ShieldCheck, Mail } from "lucide-react";

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
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-8 rounded-3xl shadow-2xl"
      >
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
          <ShieldCheck className="text-indigo-400 w-8 h-8" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{t("title")}</h1>
          <p className="text-neutral-400 text-sm flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            {t("subtitle", { email: maskEmail(email) })}
          </p>
        </div>

        <motion.div
          className="flex justify-center gap-2 mb-6"
          onPaste={handleOnPaste}
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {otp.map((_, index) => (
            <input
              key={index}
              disabled={isLoading}
              ref={index === activeOTPIndex ? inputRef : null}
              type="number"
              className={`w-12 h-14 md:w-14 md:h-16 text-center text-xl font-semibold bg-neutral-950 text-white rounded-xl border-2 transition-all outline-none 
                ${activeOTPIndex === index ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "border-neutral-800"} 
                ${otp[index] ? "border-neutral-700 bg-neutral-900" : ""}
                ${isLoading ? "opacity-50" : ""}
              `}
              onChange={(e) => handleOnChange(e, index)}
              onKeyDown={(e) => handleOnKeyDown(e, index)}
              onFocus={() => setActiveOTPIndex(index)}
              value={otp[index]}
              maxLength={1}
            />
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {errorStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-6 text-center text-sm font-medium ${errorStatus.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}
            >
              {errorStatus.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8">
          <label className="flex items-center justify-center space-x-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                disabled={isLoading}
              />
              <div className="w-5 h-5 bg-neutral-950 border-2 border-neutral-700 rounded peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors peer-focus:ring-2 peer-focus:ring-indigo-500/30"></div>
              <svg className="absolute w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">
              {t("trustDevice")}
            </span>
          </label>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => verifyCode(otp.join(""))}
            disabled={isLoading || otp.join("").length < 6}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                <span>{t("verify")}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={handleResend}
            disabled={!canResend || isLoading}
            className="text-sm text-neutral-400 hover:text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-neutral-400"
          >
            {canResend ? t("resend") : t("resendIn", { seconds: cooldown })}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
