/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import {
  Bell, BellOff, Loader2, LogOut, Package, Clock,
  CheckCircle2, Edit2, X, Check, AlertCircle, Plus, Flame, User, Building2,
} from "lucide-react";

export default function ResidentDashboard() {
  const t = useTranslations("Resident");
  const tCommon = useTranslations("DashboardCommon");
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  // Apartment edit state
  const [isEditingApt, setIsEditingApt] = useState(false);
  const [aptNumber, setAptNumber] = useState("");
  const [tower, setTower] = useState("");
  const [isSavingApt, setIsSavingApt] = useState(false);

  const {
    isSubscribed,
    isSupported,
    isLoading: isPushLoading,
    subscribe,
    unsubscribe,
  } = usePushSubscription();

  const [packages, setPackages] = useState<any[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  // Claims state
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimType, setClaimType] = useState("OTHER");
  const [claimPackageId, setClaimPackageId] = useState("");
  const [claimDesc, setClaimDesc] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/packages");
      if (res.ok) setPackages(await res.json());
    } catch (error) {
      console.error("Error fetching packages:", error);
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
        body: JSON.stringify({
          description: claimDesc,
          type: claimType,
          packageId: claimPackageId || undefined,
        }),
      });
      if (res.ok) {
        const newClaim = await res.json();
        setClaims((prev) => [newClaim, ...prev]);
        toast.success(t("claimCreated"));
        setShowClaimForm(false);
        setClaimDesc("");
        setClaimType("OTHER");
        setClaimPackageId("");
      } else {
        toast.error(t("errorCreate"));
      }
    } catch {
      toast.error(t("errorCreate"));
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchPackages();
      fetchClaims();
    }
  }, [status, router, fetchPackages, fetchClaims]);

  const handleUpdateApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingApt(true);
    try {
      const res = await fetch("/api/profile/update-apartment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apartmentNumber: aptNumber, tower }),
      });
      if (res.ok) {
        await updateSession();
        await fetchPackages();
        setIsEditingApt(false);
      }
    } catch (error) {
      console.error("Error updating apartment:", error);
    } finally {
      setIsSavingApt(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base transition-theme">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-text-muted font-medium">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  const currentApt = (session?.user as any)?.apartment;
  const totalParcels = packages.length;
  const waitingPickup = packages.filter((p) => p.status !== "DELIVERED").length;
  const alreadyPickedUp = packages.filter((p) => p.status === "DELIVERED").length;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary transition-theme">

      {/* ── Fixed header ─────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center glow-indigo-sm">
              <Package className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-display font-black text-lg tracking-tight">Loombox</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full border border-border-subtle object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-400" aria-hidden="true" />
              </div>
            )}
            <span className="hidden sm:block text-sm font-semibold text-text-primary truncate max-w-[140px]">
              {session?.user?.name}
            </span>
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-bg-surface border border-border-subtle text-text-secondary text-xs font-bold hover:text-text-primary hover:border-indigo-500/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            >
              Perfil
            </button>
            <button
              onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-16">

        {/* ── Welcome + Push ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8 transition-theme"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">

            {/* Profile info */}
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <div className="relative shrink-0">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-14 h-14 rounded-2xl border-2 border-border-subtle object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border-2 border-indigo-500/25 flex items-center justify-center">
                    <User className="w-7 h-7 text-indigo-400" aria-hidden="true" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-[3px] border-bg-surface rounded-full" />
              </div>

              <div className="min-w-0 space-y-1.5">
                <h1 className="text-xl font-bold text-text-primary tracking-tight truncate">
                  {t("welcome")}, {session?.user?.name?.split(" ")[0] || "Residente"}
                </h1>
                <p className="text-sm text-text-muted truncate">{session?.user?.email}</p>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {/* Role */}
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 text-[10px] font-bold uppercase tracking-wider">
                    {t("role")}: RESIDENTE
                  </span>

                  {/* Apartment inline edit */}
                  <AnimatePresence mode="wait">
                    {isEditingApt ? (
                      <motion.form
                        key="edit"
                        onSubmit={handleUpdateApartment}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          autoFocus
                          className="w-20 px-2 py-1 rounded-lg bg-bg-base border border-border-subtle text-text-primary text-xs font-bold focus:outline-none focus:border-indigo-500/50 transition-colors"
                          placeholder={t("aptPlaceholder")}
                          value={aptNumber}
                          onChange={(e) => setAptNumber(e.target.value)}
                          required
                        />
                        <input
                          className="w-20 px-2 py-1 rounded-lg bg-bg-base border border-border-subtle text-text-primary text-xs font-bold focus:outline-none focus:border-indigo-500/50 transition-colors"
                          placeholder={t("towerPlaceholderShort")}
                          value={tower}
                          onChange={(e) => setTower(e.target.value)}
                        />
                        <button
                          type="submit"
                          disabled={isSavingApt}
                          className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSavingApt ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingApt(false)}
                          className="p-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.form>
                    ) : (
                      <motion.button
                        key="display"
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                          setAptNumber(currentApt?.number || "");
                          setTower(currentApt?.tower || "");
                          setIsEditingApt(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        <Building2 className="w-3 h-3" aria-hidden="true" />
                        {currentApt
                          ? `${currentApt.number}${currentApt.tower ? ` · ${currentApt.tower}` : ""}`
                          : "--"}
                        <Edit2 className="w-3 h-3" aria-hidden="true" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-20 bg-border-subtle shrink-0" />

            {/* Push toggle */}
            <div className="lg:w-60 shrink-0 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {isSubscribed ? (
                  <Bell className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                ) : (
                  <BellOff className="w-4 h-4 text-text-muted" aria-hidden="true" />
                )}
                <span className="text-sm font-bold text-text-primary">{t("pushTitle")}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{t("pushDesc")}</p>
              {!isSupported ? (
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {t("pushUnsupported")}
                </p>
              ) : (
                <button
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  disabled={isPushLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                    isSubscribed
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                      : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/25"
                  }`}
                >
                  {isPushLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSubscribed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      {t("pushEnabled")}
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" aria-hidden="true" />
                      {t("pushDisabled")}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Stats ────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <StatCard
            label={t("myParcels")}
            value={isLoadingPackages ? "—" : totalParcels.toString()}
            icon={<Package className="w-5 h-5" />}
            color="indigo"
          />
          <StatCard
            label={t("waitingPickup")}
            value={isLoadingPackages ? "—" : waitingPickup.toString()}
            icon={<Clock className="w-5 h-5" />}
            color="amber"
          />
          <StatCard
            label={t("alreadyPickedUp")}
            value={isLoadingPackages ? "—" : alreadyPickedUp.toString()}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
        </motion.div>

        {/* ── Package grid ─────────────────────────── */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-base font-bold text-text-primary tracking-tight">
            {t("myParcels")}
          </h2>

          {isLoadingPackages ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t("emptyTitle")}
              description={t("emptyDesc")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`bg-bg-surface border rounded-2xl p-5 flex flex-col gap-4 hover:border-indigo-500/25 transition-colors cursor-pointer group ${
                    pkg.isPerishable
                      ? "border-l-[3px] border-l-red-500 border-t border-r border-b border-border-subtle"
                      : "border-border-subtle"
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                      <Package className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                    </div>
                    <StatusBadge status={pkg.status} />
                  </div>

                  {/* Tracking */}
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
                      Seguimiento
                    </p>
                    <p className="font-mono text-base font-bold text-indigo-400 glow-text-indigo">
                      {pkg.trackingCode}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
                    <p className="text-xs text-text-muted">
                      {new Date(pkg.createdAt).toLocaleDateString()}{" "}
                      {new Date(pkg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {pkg.isPerishable && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        <Flame className="w-3 h-3" aria-hidden="true" />
                        Perecible
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Claims ───────────────────────────────── */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary tracking-tight">
              {t("myClaims")}
            </h2>
            <button
              onClick={() => setShowClaimForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 text-xs font-bold hover:bg-indigo-500/25 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              {t("createClaim")}
            </button>
          </div>

          {/* Create claim modal */}
          <Modal
            open={showClaimForm}
            onClose={() => setShowClaimForm(false)}
            title={t("createClaim")}
          >
            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                  {t("claimType")}
                </label>
                <select
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-text-primary text-sm focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                >
                  <option value="WRONG_PACKAGE">{t("typeWrongPackage")}</option>
                  <option value="DAMAGED">{t("typeDamaged")}</option>
                  <option value="MISSING">{t("typeMissing")}</option>
                  <option value="OTHER">{t("typeOther")}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                  {t("claimPackage")}
                </label>
                <select
                  value={claimPackageId}
                  onChange={(e) => setClaimPackageId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-text-primary text-sm focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                >
                  <option value="">— {t("claimPackage")} —</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.trackingCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                  {t("claimDescription")}
                </label>
                <textarea
                  value={claimDesc}
                  onChange={(e) => setClaimDesc(e.target.value)}
                  required
                  minLength={10}
                  rows={4}
                  placeholder="Describe el problema..."
                  className="w-full px-3 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                />
                <p
                  className={`text-[10px] font-medium ${
                    claimDesc.length >= 10 ? "text-emerald-400" : "text-text-muted"
                  }`}
                >
                  {claimDesc.length}/10 mín.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowClaimForm(false)}
                  className="px-4 py-2 rounded-lg bg-bg-base text-text-muted text-sm font-semibold hover:text-text-primary transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={claimDesc.trim().length < 10 || isSubmittingClaim}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmittingClaim && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {t("submitClaim")}
                </button>
              </div>
            </form>
          </Modal>

          {/* Claims list */}
          {isLoadingClaims ? (
            <div className="flex items-center gap-3 px-1 py-6">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted/40" />
              <span className="text-sm text-text-muted">{tCommon("loading")}</span>
            </div>
          ) : claims.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-text-muted">{t("noClaims")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim, index) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-bg-surface border border-border-subtle rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-theme"
                >
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 sm:w-auto">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                      {claim.type === "WRONG_PACKAGE"
                        ? t("typeWrongPackage")
                        : claim.type === "DAMAGED"
                        ? t("typeDamaged")
                        : claim.type === "MISSING"
                        ? t("typeMissing")
                        : t("typeOther")}
                    </span>
                    <StatusBadge status={claim.status} />
                    {claim.package?.trackingCode && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold">
                        {claim.package.trackingCode}
                      </span>
                    )}
                  </div>

                  {/* Description + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary line-clamp-2">
                      {claim.description}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(claim.createdAt).toLocaleDateString()}{" "}
                      {new Date(claim.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {currentApt &&
                        ` · Depto ${currentApt.number}${
                          currentApt.tower ? ` - ${currentApt.tower}` : ""
                        }`}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Coming soon ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-bg-surface border border-border-subtle rounded-2xl p-6 transition-theme"
        >
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-3">
            {t("comingSoonTitle")}
          </p>
          <div className="flex flex-wrap gap-2">
            {[t("f1"), t("f2"), t("f3"), t("f4"), t("f5")].map((feat, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-bg-base border border-border-subtle text-text-muted text-xs font-medium"
              >
                {feat}
              </span>
            ))}
          </div>
        </motion.div>

      </main>
    </div>
  );
}
