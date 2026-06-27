/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import {
  Loader2, Package, Clock, CheckCircle2,
  X, Check, AlertCircle, Plus, Building2,
  QrCode, Pencil,
} from "lucide-react";
import QRModal from "@/components/QRModal";

type PkgFilter = "all" | "pending" | "delivered";

export default function ResidentDashboard() {
  const t = useTranslations("Resident");
  const tCommon = useTranslations("DashboardCommon");
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [isEditingApt, setIsEditingApt]         = useState(false);
  const [aptNumber, setAptNumber]               = useState("");
  const [tower, setTower]                       = useState("");
  const [isSavingApt, setIsSavingApt]           = useState(false);
  const [aptOptions, setAptOptions]             = useState<{ id: string; number: string; tower: string | null }[]>([]);
  const [isLoadingAptOptions, setIsLoadingAptOptions] = useState(false);
  const [selectedAptId, setSelectedAptId]       = useState("");

  const [showNotifyConcierge, setShowNotifyConcierge] = useState(false);
  const [notifyMsg, setNotifyMsg]               = useState("");
  const [isNotifying, setIsNotifying]           = useState(false);
  const [notifySent, setNotifySent]             = useState(false);

  const [packages, setPackages]                 = useState<any[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [pkgFilter, setPkgFilter]               = useState<PkgFilter>("all");

  const [claims, setClaims]                     = useState<any[]>([]);
  const [isLoadingClaims, setIsLoadingClaims]   = useState(true);
  const [showClaimForm, setShowClaimForm]       = useState(false);
  const [claimType, setClaimType]               = useState("OTHER");
  const [claimPackageId, setClaimPackageId]     = useState("");
  const [claimDesc, setClaimDesc]               = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [qrModal, setQrModal]                   = useState<{ packageId: string; trackingCode: string } | null>(null);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/packages");
      if (res.ok) setPackages(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPackages(false);
    }
  }, []);

  const fetchClaims = useCallback(async () => {
    try {
      const res = await fetch("/api/claims");
      if (res.ok) setClaims(await res.json());
    } finally {
      setIsLoadingClaims(false);
    }
  }, []);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClaim(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: claimDesc, type: claimType, packageId: claimPackageId || undefined }),
      });
      if (res.ok) {
        const newClaim = await res.json();
        setClaims((prev) => [newClaim, ...prev]);
        toast.success(t("claimCreated"));
        setShowClaimForm(false);
        setClaimDesc(""); setClaimType("OTHER"); setClaimPackageId("");
      } else toast.error(t("errorCreate"));
    } catch { toast.error(t("errorCreate")); }
    finally { setIsSubmittingClaim(false); }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") { fetchPackages(); fetchClaims(); }
  }, [status, router, fetchPackages, fetchClaims]);

  const handleUpdateApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const selected = aptOptions.find(a => a.id === selectedAptId);
    if (!selected) return;
    setIsSavingApt(true);
    try {
      const res = await fetch("/api/profile/update-apartment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apartmentNumber: selected.number, tower: selected.tower ?? "" }),
      });
      if (res.ok) { await updateSession(); await fetchPackages(); setIsEditingApt(false); }
      else toast.error(t("errorSaveApartment"));
    } catch (e) {
      console.error(e); toast.error(t("errorSaveApartment"));
    } finally { setIsSavingApt(false); }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="loombox-loader">
          <p className="loombox-loader-text">Cargando</p>
          <span className="loombox-load"></span>
        </div>
      </div>
    );
  }

  const currentApt    = (session?.user as any)?.apartment;
  const totalParcels  = packages.length;
  const waitingPickup = packages.filter(p => p.status !== "DELIVERED").length;
  const alreadyPickedUp = packages.filter(p => p.status === "DELIVERED").length;
  const openClaims    = claims.filter(c => c.status === "OPEN").length;

  const sortedPackages = [...packages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const filteredPackages = sortedPackages.filter(pkg => {
    if (pkgFilter === "pending")   return pkg.status !== "DELIVERED";
    if (pkgFilter === "delivered") return pkg.status === "DELIVERED";
    return true;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  /* ── helpers ─────────────────────────────────────────────── */
  const openAptEdit = () => {
    setAptNumber(currentApt?.number || "");
    setTower(currentApt?.tower || "");
    setIsEditingApt(true);
    if (aptOptions.length === 0) {
      setIsLoadingAptOptions(true);
      fetch("/api/apartments")
        .then(r => r.json())
        .then((data: { id: string; number: string; tower: string | null }[]) => {
          setAptOptions(data.sort((a, b) => parseInt(a.number) - parseInt(b.number)));
          const cur = data.find(a => a.number === currentApt?.number);
          if (cur) setSelectedAptId(cur.id);
        })
        .catch(() => {})
        .finally(() => setIsLoadingAptOptions(false));
    } else {
      const cur = aptOptions.find(a => a.number === currentApt?.number);
      if (cur) setSelectedAptId(cur.id);
    }
  };

  /* ── stat card data ───────────────────────────────────────── */
  const stats = [
    {
      label: t("myParcels"),
      sub: "Total recibidos",
      value: totalParcels,
      icon: Package,
      color: "#6366F1",
      glow: "rgba(99,102,241,0.18)",
      border: "rgba(99,102,241,0.22)",
    },
    {
      label: t("waitingPickup"),
      sub: "Esperando retiro",
      value: waitingPickup,
      icon: Clock,
      color: "#F59E0B",
      glow: "rgba(245,158,11,0.14)",
      border: "rgba(245,158,11,0.20)",
    },
    {
      label: t("alreadyPickedUp"),
      sub: "Ya retirados",
      value: alreadyPickedUp,
      icon: CheckCircle2,
      color: "#10B981",
      glow: "rgba(16,185,129,0.14)",
      border: "rgba(16,185,129,0.20)",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-7">

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-[52px] h-[52px] rounded-2xl overflow-hidden shrink-0"
            style={{
              background: "rgba(99,102,241,0.14)",
              border: "1.5px solid rgba(99,102,241,0.28)",
              boxShadow: "0 0 18px rgba(99,102,241,0.14)",
            }}
          >
            {session?.user?.image ? (
              <img src={session.user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-lg font-bold text-[#818CF8]">
                {session?.user?.name?.charAt(0) ?? "?"}
              </span>
            )}
          </div>

          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: "rgba(255,255,255,0.26)" }}>
              {greeting}
            </p>
            <h1
              className="text-[22px] font-bold text-white leading-tight mt-0.5"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              {session?.user?.name?.split(" ")[0] ?? t("defaultName")}
            </h1>

            {/* Apartment badge / edit */}
            <div className="mt-1.5">
              <AnimatePresence mode="wait">
                {isEditingApt ? (
                  <motion.form key="edit" onSubmit={handleUpdateApartment}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 flex-wrap">
                    {isLoadingAptOptions ? (
                      <span className="flex items-center gap-1.5 text-xs px-2 py-1"
                        style={{ color: "rgba(255,255,255,0.38)" }}>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("loadingApts")}
                      </span>
                    ) : (
                      <select value={selectedAptId} onChange={e => setSelectedAptId(e.target.value)}
                        required autoFocus
                        className="w-36 px-2 py-1.5 rounded-lg text-white text-xs font-bold focus:outline-none cursor-pointer"
                        style={{ background: "#0A0A18", border: "1px solid rgba(99,102,241,0.4)" }}>
                        <option value="" disabled>{t("selectAptPlaceholder")}</option>
                        {aptOptions.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.number}{a.tower ? ` · ${a.tower}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    <button type="submit" disabled={isSavingApt}
                      className="p-1.5 rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
                      style={{ background: "rgba(16,185,129,0.14)", color: "#10B981", border: "1px solid rgba(16,185,129,0.24)" }}>
                      {isSavingApt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button type="button" onClick={() => setIsEditingApt(false)}
                      className="p-1.5 rounded-lg cursor-pointer transition-colors"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.22)" }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button type="button"
                      onClick={() => { setNotifyMsg(""); setNotifySent(false); setShowNotifyConcierge(true); }}
                      className="text-[10px] cursor-pointer transition-colors"
                      style={{ color: "rgba(130,120,255,0.7)" }}>
                      {t("findAptLink")}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5">
                    <span
                      className="text-[11px] font-semibold rounded-full px-3 py-1 flex items-center gap-1.5"
                      style={{
                        background: "rgba(99,102,241,0.09)",
                        color: "#a5b4fc",
                        border: "1px solid rgba(99,102,241,0.18)",
                      }}
                    >
                      <Building2 className="w-3 h-3" />
                      {currentApt
                        ? `Depto ${currentApt.number}${currentApt.tower ? ` · ${currentApt.tower}` : ""}`
                        : "Sin depto"}
                    </span>
                    <button onClick={openAptEdit}
                      className="p-1.5 rounded-lg cursor-pointer transition-colors"
                      style={{ color: "rgba(255,255,255,0.18)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.18)"}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Alert pills */}
        {!isLoadingPackages && (
          <div className="flex items-center gap-2 flex-wrap">
            {waitingPickup > 0 && (
              <span className="flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-3.5 py-1.5"
                style={{ background: "rgba(245,158,11,0.10)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.20)" }}>
                <Clock className="w-3.5 h-3.5" />
                {waitingPickup} pendiente{waitingPickup !== 1 ? "s" : ""}
              </span>
            )}
            {openClaims > 0 && (
              <span className="flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-3.5 py-1.5"
                style={{ background: "rgba(239,68,68,0.09)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.17)" }}>
                <AlertCircle className="w-3.5 h-3.5" />
                {openClaims} reclamo{openClaims !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </motion.div>

      {/* ══ STAT CARDS ══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-3 gap-3"
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${s.glow} 0%, rgba(8,8,16,0.7) 100%)`,
              border: `1px solid ${s.border}`,
            }}
          >
            {/* glow orb */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${s.glow} 0%, transparent 70%)` }} />

            <div className="flex items-start justify-between mb-3">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] leading-tight"
                style={{ color: "rgba(255,255,255,0.32)" }}>
                {s.label}
              </p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${s.glow}`, border: `1px solid ${s.border}` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>

            <p className="text-[38px] font-bold text-white leading-none">
              {isLoadingPackages ? "—" : s.value}
            </p>

            <p className="mt-2.5 text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>
              {s.sub}
            </p>
          </div>
        ))}
      </motion.div>

      {/* ══ TWO-COLUMN GRID ═════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

      {/* ══ PACKAGES ════════════════════════════════════════════ */}
      <motion.section
        id="packages"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[17px] font-bold text-white">{t("myParcels")}</h2>
            {!isLoadingPackages && totalParcels > 0 && (
              <span className="text-[10.5px] font-bold rounded-full px-2.5 py-0.5"
                style={{ background: "rgba(99,102,241,0.14)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.22)" }}>
                {totalParcels}
              </span>
            )}
          </div>

          {totalParcels > 0 && (
            <div className="flex items-center gap-1 p-1 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {(["all", "pending", "delivered"] as PkgFilter[]).map(f => (
                <button key={f} onClick={() => setPkgFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                  style={{
                    background: pkgFilter === f ? "rgba(99,102,241,0.18)" : "transparent",
                    color: pkgFilter === f ? "#a5b4fc" : "rgba(255,255,255,0.32)",
                    border: pkgFilter === f ? "1px solid rgba(99,102,241,0.28)" : "1px solid transparent",
                  }}>
                  {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : "Entregados"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* No apartment */}
        {!currentApt && !isLoadingPackages && packages.length === 0 ? (
          <div className="rounded-2xl p-8 text-center space-y-4"
            style={{ background: "rgba(245,158,11,0.04)", border: "1px dashed rgba(245,158,11,0.22)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "rgba(245,158,11,0.11)", border: "1px solid rgba(245,158,11,0.20)" }}>
              <Building2 className="w-7 h-7" style={{ color: "#F59E0B" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{t("noAptTitle")}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>{t("noAptDesc")}</p>
            </div>
            <button onClick={() => { setIsEditingApt(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold cursor-pointer transition-colors"
              style={{ background: "rgba(245,158,11,0.14)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.22)" }}>
              <Building2 className="w-4 h-4" />
              {t("noAptButton")}
            </button>
          </div>

        ) : isLoadingPackages ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>

        ) : filteredPackages.length === 0 ? (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Package className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.18)" }} />
            <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.38)" }}>{t("emptyTitle")}</p>
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.20)" }}>{t("emptyDesc")}</p>
          </div>

        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPackages.map((pkg, i) => {
              const isPending = pkg.status !== "DELIVERED";
              const accentColor   = isPending ? "#F59E0B" : "#10B981";
              const accentGlow    = isPending ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.07)";
              const accentBorder  = isPending ? "rgba(245,158,11,0.18)" : "rgba(16,185,129,0.17)";
              const trackingColor = isPending ? "#FCD34D" : "#34D399";

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl p-5 flex flex-col gap-4"
                  style={{
                    background: `linear-gradient(135deg, ${accentGlow} 0%, rgba(8,8,14,0.85) 65%)`,
                    border: `1px solid ${accentBorder}`,
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${accentGlow}`}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${accentGlow}`, border: `1px solid ${accentBorder}` }}>
                        <Package className="w-4 h-4" style={{ color: accentColor }} />
                      </div>
                      <div>
                        <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                          style={{ color: "rgba(255,255,255,0.26)" }}>
                          {t("trackingLabel")}
                        </p>
                        <p className="text-[17px] font-bold font-mono leading-tight" style={{ color: trackingColor }}>
                          {pkg.trackingCode}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold rounded-full px-2.5 py-1"
                      style={{
                        background: isPending ? "rgba(245,158,11,0.11)" : "rgba(16,185,129,0.10)",
                        color: accentColor,
                        border: `1px solid ${accentBorder}`,
                      }}>
                      {isPending ? t("statusPending") : t("statusDelivered")}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="space-y-1.5 pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: "rgba(255,255,255,0.26)" }}>
                        {t("arrivedAt")}
                      </span>
                      <span className="text-[11.5px] font-medium" style={{ color: "rgba(255,255,255,0.58)" }}>
                        {new Date(pkg.createdAt).toLocaleDateString()} · {new Date(pkg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {pkg.status === "DELIVERED" && pkg.pickedUpAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                          style={{ color: "#10B981" }}>
                          {t("pickedUpAt")}
                        </span>
                        <span className="text-[11.5px] font-semibold" style={{ color: "#34D399" }}>
                          {new Date(pkg.pickedUpAt).toLocaleDateString()} · {new Date(pkg.pickedUpAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-auto">
                    {pkg.isPerishable ? (
                      <span className="text-[10px] font-bold rounded-full px-2.5 py-1"
                        style={{ background: "rgba(239,68,68,0.09)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.18)" }}>
                        🌡 {t("perishableBadge")}
                      </span>
                    ) : <div />}

                    <button
                      onClick={() => setQrModal({ packageId: pkg.id, trackingCode: pkg.trackingCode })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.42)", border: "1px solid rgba(255,255,255,0.07)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)"; (e.currentTarget as HTMLElement).style.color = "#a5b4fc"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.42)"; }}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      {tCommon("viewQR")}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* ══ CLAIMS ══════════════════════════════════════════════ */}
      <motion.section
        id="claims"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[17px] font-bold text-white">{t("myClaims")}</h2>
            {!isLoadingClaims && openClaims > 0 && (
              <span className="text-[10.5px] font-bold rounded-full px-2.5 py-0.5"
                style={{ background: "rgba(239,68,68,0.11)", color: "#F87171", border: "1px solid rgba(239,68,68,0.20)" }}>
                {openClaims} abierto{openClaims !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button onClick={() => setShowClaimForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer"
            style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.22)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.20)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)"}>
            <Plus className="w-3.5 h-3.5" />
            {t("createClaim")}
          </button>
        </div>

        {isLoadingClaims ? (
          <div className="rounded-2xl p-5 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "rgba(255,255,255,0.28)" }} />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.32)" }}>{tCommon("loading")}</span>
          </div>

        ) : claims.length === 0 ? (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}>
            <AlertCircle className="w-7 h-7 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.16)" }} />
            <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.35)" }}>{t("noClaims")}</p>
            <button onClick={() => setShowClaimForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold cursor-pointer transition-colors"
              style={{ background: "rgba(99,102,241,0.09)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.17)" }}>
              <Plus className="w-3.5 h-3.5" />
              {t("createClaim")}
            </button>
          </div>

        ) : (
          <div className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            {claims.map((claim, i) => (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="px-5 py-4 flex items-start gap-4"
                style={{
                  background: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.012)",
                  borderBottom: i < claims.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: claim.status === "RESOLVED" ? "rgba(16,185,129,0.11)" : "rgba(239,68,68,0.09)",
                    border: `1px solid ${claim.status === "RESOLVED" ? "rgba(16,185,129,0.20)" : "rgba(239,68,68,0.16)"}`,
                  }}>
                  <AlertCircle className="w-4 h-4"
                    style={{ color: claim.status === "RESOLVED" ? "#10B981" : "#EF4444" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-[10px] font-bold rounded-full px-2.5 py-0.5"
                      style={
                        claim.status === "OPEN"
                          ? { background: "rgba(245,158,11,0.10)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.18)" }
                          : claim.status === "RESOLVED"
                          ? { background: "rgba(16,185,129,0.10)", color: "#10B981", border: "1px solid rgba(16,185,129,0.18)" }
                          : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }
                      }>
                      {claim.status}
                    </span>
                    <span className="text-[10px] font-semibold rounded-full px-2.5 py-0.5"
                      style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.40)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {claim.type === "WRONG_PACKAGE" ? t("typeWrongPackage")
                        : claim.type === "DAMAGED" ? t("typeDamaged")
                        : claim.type === "MISSING" ? t("typeMissing")
                        : t("typeOther")}
                    </span>
                    {claim.package?.trackingCode && (
                      <span className="text-[10px] font-mono font-bold rounded-full px-2.5 py-0.5"
                        style={{ background: "rgba(99,102,241,0.09)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.17)" }}>
                        {claim.package.trackingCode}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-white leading-relaxed">{claim.description}</p>
                  <p className="text-[10.5px] mt-1.5" style={{ color: "rgba(255,255,255,0.26)" }}>
                    {new Date(claim.createdAt).toLocaleDateString()} ·{" "}
                    {new Date(claim.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {currentApt && ` · Depto ${currentApt.number}${currentApt.tower ? ` - ${currentApt.tower}` : ""}`}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      </div>{/* end two-column grid */}

      {/* ══ MODALS ══════════════════════════════════════════════ */}
      <Modal open={showClaimForm} onClose={() => setShowClaimForm(false)}
        title={t("createClaim")} closeAriaLabel={tCommon("qrClose")}>
        <form onSubmit={handleCreateClaim} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: "rgba(255,255,255,0.32)" }}>
              {t("claimType")}
            </label>
            <select value={claimType} onChange={e => setClaimType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none cursor-pointer"
              style={{ background: "#0C0C1C", border: "1px solid rgba(255,255,255,0.08)" }}>
              <option value="WRONG_PACKAGE">{t("typeWrongPackage")}</option>
              <option value="DAMAGED">{t("typeDamaged")}</option>
              <option value="MISSING">{t("typeMissing")}</option>
              <option value="OTHER">{t("typeOther")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: "rgba(255,255,255,0.32)" }}>
              {t("claimPackage")}
            </label>
            <select value={claimPackageId} onChange={e => setClaimPackageId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none cursor-pointer"
              style={{ background: "#0C0C1C", border: "1px solid rgba(255,255,255,0.08)" }}>
              <option value="">— {t("claimPackage")} —</option>
              {packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.trackingCode}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: "rgba(255,255,255,0.32)" }}>
              {t("claimDescription")}
            </label>
            <textarea value={claimDesc} onChange={e => setClaimDesc(e.target.value)}
              required minLength={10} rows={4} placeholder={t("claimDescPlaceholder")}
              className="w-full px-4 py-3 text-[14px] text-white placeholder-[#444] outline-none resize-none rounded-xl"
              style={{ background: "#0C0C1C", border: "1px solid rgba(255,255,255,0.08)" }} />
            <p className="text-[10px] font-medium"
              style={{ color: claimDesc.length >= 10 ? "#10B981" : "rgba(255,255,255,0.26)" }}>
              {t("claimMinCharsHint", { count: claimDesc.length })}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button type="button" onClick={() => setShowClaimForm(false)}
              className="px-5 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.45)", background: "transparent" }}>
              {t("cancel")}
            </button>
            <button type="submit" disabled={claimDesc.trim().length < 10 || isSubmittingClaim}
              className="px-5 py-2 rounded-full text-sm font-semibold cursor-pointer disabled:opacity-40 flex items-center gap-2 transition-colors"
              style={{ background: "#6366F1", color: "white" }}>
              {isSubmittingClaim && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("submitClaim")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showNotifyConcierge}
        onClose={() => { setShowNotifyConcierge(false); setNotifySent(false); }}
        title={t("notifyModalTitle")} closeAriaLabel={tCommon("qrClose")}>
        {notifySent ? (
          <div className="text-center py-4 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-white font-bold">{t("notifySuccessTitle")}</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>{t("notifySuccessDesc")}</p>
          </div>
        ) : (
          <form onSubmit={async e => {
            e.preventDefault(); setIsNotifying(true);
            try {
              await fetch("/api/notify-concierge", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: session?.user?.name || "", email: session?.user?.email || "", message: notifyMsg }),
              });
              setNotifySent(true);
            } catch { } finally { setIsNotifying(false); }
          }} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5"
                style={{ color: "rgba(255,255,255,0.32)" }}>
                {t("notifyMessageLabel")}
              </label>
              <textarea required rows={3} placeholder={t("notifyMessagePlaceholder")}
                value={notifyMsg} onChange={e => setNotifyMsg(e.target.value)}
                className="w-full px-4 py-3 text-[14px] text-white placeholder-[#444] outline-none resize-none rounded-xl"
                style={{ background: "#0C0C1C", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <button type="submit" disabled={isNotifying}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors"
              style={{ background: "#6366F1", color: "white" }}>
              {isNotifying && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("notifySendButton")}
            </button>
          </form>
        )}
      </Modal>

      {qrModal && (
        <QRModal
          packageId={qrModal.packageId}
          trackingCode={qrModal.trackingCode}
          open={true}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  );
}
