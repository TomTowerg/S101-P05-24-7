"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

type Status = "idle" | "loading" | "success" | "error";

export default function VerifyTOTPClient({ email, role }: { email: string; role: string }) {
  const t      = useTranslations("totp");
  const locale = useLocale();
  const { update } = useSession();

  const [otp, setOtp]                = useState<string[]>(new Array(6).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus]          = useState<Status>("idle");
  const [error, setError]            = useState<string | null>(null);
  const [mergePhase, setMergePhase]  = useState<"none" | "converge" | "merged">("none");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Space + digit sphere canvas ─────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const CW  = canvas.offsetWidth;
    const CH  = canvas.offsetHeight;
    canvas.width  = CW * dpr;
    canvas.height = CH * dpr;
    ctx.scale(dpr, dpr);

    const stars = Array.from({ length: 260 }, () => {
      const r = Math.random() * 1.3 + 0.2;
      const depth = r / 1.5; // bigger = closer = faster
      return {
        x: Math.random() * CW,
        y: Math.random() * CH,
        r,
        o: Math.random() * 0.65 + 0.1,
        speed: Math.random() * 0.018 + 0.004,
        phase: Math.random() * Math.PI * 2,
        dx: (Math.random() - 0.5) * 0.3 * depth,
        dy: -(0.15 + Math.random() * 0.35) * depth, // drift upward
      };
    });

    const digits = Array.from({ length: 130 }, () => ({
      theta:       Math.random() * Math.PI * 2,
      phi:         Math.acos(2 * Math.random() - 1),
      speed:       (Math.random() - 0.5) * 0.006,
      digit:       String(Math.floor(Math.random() * 10)),
      size:        Math.random() * 14 + 8,
      baseOpacity: Math.random() * 0.60 + 0.18,
    }));

    /* Sphere centered at 50% horizontally, 38% vertically */
    const R  = Math.min(CW, CH) * 0.23;
    const CX = CW / 2;
    const CY = CH * 0.38;

    let raf: number;
    let tick = 0;

    const draw = () => {
      tick += 0.016;
      ctx.clearRect(0, 0, CW, CH);

      /* Background gradient */
      const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(CW, CH) * 0.8);
      bg.addColorStop(0,   "rgba(16, 8, 38, 1)");
      bg.addColorStop(0.55, "rgba(6, 4, 18, 1)");
      bg.addColorStop(1,   "rgba(2, 1, 6, 1)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CW, CH);

      /* Stars — drift through space */
      stars.forEach((s) => {
        s.x += s.dx; s.y += s.dy;
        if (s.x < -2) s.x = CW + 2;
        if (s.x > CW + 2) s.x = -2;
        if (s.y < -2) s.y = CH + 2;
        if (s.y > CH + 2) s.y = -2;
        const alpha = s.o * (0.45 + 0.55 * Math.sin(tick * s.speed * 60 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });

      /* Nebula glow */
      const neb = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 1.7);
      neb.addColorStop(0,   "rgba(99,102,241,0.13)");
      neb.addColorStop(0.6, "rgba(139,92,246,0.05)");
      neb.addColorStop(1,   "transparent");
      ctx.fillStyle = neb;
      ctx.beginPath();
      ctx.arc(CX, CY, R * 1.7, 0, Math.PI * 2);
      ctx.fill();

      /* Digit sphere — sorted by depth */
      const pts = digits.map((p) => {
        p.theta += p.speed;
        const sx = Math.sin(p.phi) * Math.cos(p.theta);
        const sy = Math.cos(p.phi);
        const sz = Math.sin(p.phi) * Math.sin(p.theta);
        return { ...p, x: CX + R * sx, y: CY + R * sy, depth: (sz + 1) / 2 };
      }).sort((a, b) => a.depth - b.depth);

      pts.forEach(({ x, y, depth, digit, size, baseOpacity }) => {
        const op = baseOpacity * (0.12 + depth * 0.88);
        const fs = size * (0.48 + depth * 0.52);
        ctx.save();
        ctx.font      = `bold ${fs}px 'Courier New', monospace`;
        ctx.fillStyle = `rgba(180,184,255,${op})`;
        ctx.fillText(digit, x, y);
        ctx.restore();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── Focus ───────────────────────────────────────────────────────── */
  useEffect(() => {
    inputRefs.current[activeIndex]?.focus();
  }, [activeIndex]);

  const maskEmail = (e: string) => {
    const [name, domain] = e.split("@");
    if (!name || !domain) return e;
    return `${name.charAt(0)}***@${domain}`;
  };

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
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-totp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        setStatus("success");
        await update();
        setTimeout(() => setMergePhase("converge"), 80);
        setTimeout(() => setMergePhase("merged"), 480);
        setTimeout(() => {
          window.location.href = role === "CONSERJE"
            ? `/${locale}/dashboard/conserje`
            : `/${locale}/dashboard/resident`;
        }, 1600);
      } else {
        setStatus("error");
        setError(t("invalidCode"));
        setTimeout(() => {
          setStatus("idle");
          setOtp(new Array(6).fill(""));
          setActiveIndex(0);
          setError(null);
        }, 1600);
      }
    } catch {
      setStatus("error");
      setError("Network error");
      setTimeout(() => setStatus("idle"), 1600);
    }
  };

  const boxClass = (index: number) => {
    const base = "w-[54px] h-[64px] text-center text-[26px] font-bold text-white rounded-2xl outline-none transition-all duration-200 border-2 bg-white/[0.05] backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ";
    if (status === "success") return base + "border-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.55)]";
    if (status === "error")   return base + "border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.5)]";
    if (status === "loading") return base + "border-white/10 opacity-50 cursor-not-allowed";
    if (activeIndex === index) return base + "border-[#6366F1] shadow-[0_0_16px_rgba(99,102,241,0.45)]";
    if (otp[index])            return base + "border-white/25";
    return base + "border-white/[0.08]";
  };

  return (
    <div className="fixed inset-0">
      {/* Full-screen space canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Content overlay — heading + inputs sit just below the sphere */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen pt-[63vh] px-6 gap-5">

        {/* ── Heading — sits just above the inputs, below the sphere ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <h1
            className="text-[28px] font-bold text-white leading-tight"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            {t("verifyShort")}
          </h1>
          <p className="text-[13px] text-white/40 mt-1.5">
            {t("subtitle", { email: maskEmail(email) })}
          </p>
        </motion.div>

        {/* ── Inputs + merge animation ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[380px] flex flex-col items-center gap-3"
        >
          <AnimatePresence mode="wait">
            {mergePhase !== "merged" ? (
              <motion.div
                key="inputs"
                className="flex gap-3 justify-center"
                animate={status === "error" ? { x: [0, -10, 10, -7, 7, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.45 }}
                onPaste={handlePaste}
              >
                {otp.map((digit, index) => (
                  <motion.div
                    key={index}
                    animate={mergePhase === "converge" ? {
                      x: (2.5 - index) * 66,
                      opacity: 0,
                      scale: 0.75,
                    } : { x: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <input
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="number"
                      inputMode="numeric"
                      disabled={status === "loading" || status === "success"}
                      className={boxClass(index)}
                      onChange={(e) => handleChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onFocus={() => setActiveIndex(index)}
                      value={digit}
                      maxLength={1}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="success-box"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center rounded-2xl border-2 border-emerald-400"
                style={{
                  width: 74, height: 84,
                  background: "rgba(52,211,153,0.07)",
                  boxShadow: "0 0 32px rgba(52,211,153,0.45), inset 0 1px 0 rgba(52,211,153,0.15)",
                }}
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ width: 36, height: 36 }}
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    stroke="#34D399"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
                  />
                </motion.svg>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && status === "error" && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[13px] text-red-400 text-center">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
