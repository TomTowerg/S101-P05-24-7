/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import {
  Bell, BellOff, Loader2, LogOut, Package, Clock,
  CheckCircle2, Edit2, X, Check, AlertCircle, Plus, User, Building2, QrCode, Pencil,
} from "lucide-react";
import QRModal from "@/components/QRModal";

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
  const [aptOptions, setAptOptions] = useState<{id: string; number: string; tower: string | null}[]>([]);
  const [isLoadingAptOptions, setIsLoadingAptOptions] = useState(false);
  const [selectedAptId, setSelectedAptId] = useState("");

  // Notify concierge state
  const [showNotifyConcierge, setShowNotifyConcierge] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [isNotifying, setIsNotifying] = useState(false);
  const [notifySent, setNotifySent] = useState(false);

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
  const [qrModal, setQrModal] = useState<{ packageId: string; trackingCode: string } | null>(null);

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
    const selected = aptOptions.find(a => a.id === selectedAptId);
    if (!selected) return;
    setIsSavingApt(true);
    try {
      const res = await fetch("/api/profile/update-apartment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apartmentNumber: selected.number, tower: selected.tower ?? "" }),
      });
      if (res.ok) {
        await updateSession();
        await fetchPackages();
        setIsEditingApt(false);
      } else {
        toast.error(t("errorSaveApartment"));
      }
    } catch (error) {
      console.error("Error updating apartment:", error);
      toast.error(t("errorSaveApartment"));
    } finally {
      setIsSavingApt(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#6366F1] mx-auto mb-4" />
          <p className="text-[#606060] font-medium">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  const currentApt = (session?.user as any)?.apartment;
  const totalParcels = packages.length;
  const waitingPickup = packages.filter((p) => p.status !== "DELIVERED").length;
  const alreadyPickedUp = packages.filter((p) => p.status === "DELIVERED").length;

  return (
    <div className="min-h-screen bg-[#141414]">
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Welcome Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-6"
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">
            {/* LEFT: user info */}
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center shrink-0 overflow-hidden">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-[#6366F1]">
                    {session?.user?.name?.charAt(0) ?? "?"}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#606060] uppercase tracking-widest mb-1">Residente</p>
                <h1 className="text-[28px] font-bold text-white leading-tight mb-1">
                  {session?.user?.name || t("defaultName")}
                </h1>
                <p className="text-[14px] text-[#A0A0A0]">{session?.user?.email}</p>
                {/* Apartment badge with edit */}
                <div className="flex items-center gap-2 mt-2">
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
                        {isLoadingAptOptions ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#A0A0A0]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("loadingApts")}
                          </div>
                        ) : (
                          <select
                            value={selectedAptId}
                            onChange={(e) => setSelectedAptId(e.target.value)}
                            required
                            autoFocus
                            className="w-36 px-2 py-1 rounded-lg bg-[#141414] border border-white/[0.08] text-white text-xs font-bold focus:outline-none focus:border-[#6366F1]/50 transition-colors cursor-pointer"
                          >
                            <option value="" disabled>{t("selectAptPlaceholder")}</option>
                            {aptOptions.map(apt => (
                              <option key={apt.id} value={apt.id}>
                                {apt.number}{apt.tower ? ` · ${apt.tower}` : ""}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          type="submit"
                          disabled={isSavingApt}
                          className="p-1.5 rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 hover:bg-[#10B981]/25 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSavingApt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingApt(false)}
                          className="p-1.5 rounded-lg bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/25 hover:bg-[#EF4444]/25 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.form>
                    ) : (
                      <motion.div
                        key="display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <span className="bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 text-[11px] font-semibold rounded-full px-3 py-1">
                          {currentApt
                            ? `${currentApt.number}${currentApt.tower ? ` · ${currentApt.tower}` : ""}`
                            : "--"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAptNumber(currentApt?.number || "");
                            setTower(currentApt?.tower || "");
                            setIsEditingApt(true);
                            if (aptOptions.length === 0) {
                              setIsLoadingAptOptions(true);
                              fetch("/api/apartments")
                                .then(r => r.json())
                                .then((data: {id: string; number: string; tower: string | null}[]) => {
                                  setAptOptions(data.sort((a, b) => parseInt(a.number) - parseInt(b.number)));
                                  const current = data.find(a => a.number === currentApt?.number);
                                  if (current) setSelectedAptId(current.id);
                                })
                                .catch(() => {})
                                .finally(() => setIsLoadingAptOptions(false));
                            } else {
                              const current = aptOptions.find(a => a.number === currentApt?.number);
                              if (current) setSelectedAptId(current.id);
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-white/[0.05] text-[#606060] hover:text-white transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {isEditingApt && (
                    <button
                      type="button"
                      onClick={() => { setNotifyMsg(""); setNotifySent(false); setShowNotifyConcierge(true); }}
                      className="text-[10px] text-[#606060] hover:text-[#6366F1] underline underline-offset-1 transition-colors cursor-pointer mt-1"
                    >
                      {t("findAptLink")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: push notification toggle + profile/signout buttons */}
            <div className="flex flex-col items-end gap-3">
              {/* Push notification toggle */}
              <div className="flex items-center gap-3 bg-[#262626] rounded-xl px-4 py-3 border border-white/[0.08]">
                {isSubscribed
                  ? <Bell className="w-4 h-4 text-[#6366F1]" />
                  : <BellOff className="w-4 h-4 text-[#606060]" />}
                <span className="text-[13px] text-[#A0A0A0]">{t("pushTitle")}</span>
                {!isSupported ? (
                  <span className="text-[11px] text-[#606060]">{t("pushUnsupported")}</span>
                ) : (
                  <button
                    type="button"
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    disabled={isPushLoading}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 disabled:opacity-50 cursor-pointer ${
                      isSubscribed ? "bg-[#6366F1]" : "bg-[#2E2E2E]"
                    }`}
                  >
                    {isPushLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin absolute top-1 left-1 text-white" />
                    ) : (
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          isSubscribed ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    )}
                  </button>
                )}
              </div>

              {/* Profile + signout buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/dashboard/profile")}
                  className="border border-white/[0.12] text-[#A0A0A0] hover:text-white rounded-full px-4 py-2 text-[13px] font-medium transition-colors bg-transparent cursor-pointer flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5" />
                  {t("profileButton")}
                </button>
                <button
                  onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
                  className="border border-white/[0.12] text-[#A0A0A0] hover:text-white rounded-full px-4 py-2 text-[13px] font-medium transition-colors bg-transparent cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t("signOut")}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stat Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {/* Total packages */}
          <div className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] font-semibold text-[#606060] uppercase tracking-widest">{t("myParcels")}</p>
              <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-[#6366F1]" />
              </div>
            </div>
            <p className="text-[42px] font-bold text-white leading-none">
              {isLoadingPackages ? "—" : totalParcels}
            </p>
          </div>

          {/* Pending packages */}
          <div className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] font-semibold text-[#606060] uppercase tracking-widest">{t("waitingPickup")}</p>
              <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#F59E0B]" />
              </div>
            </div>
            <p className="text-[42px] font-bold text-white leading-none">
              {isLoadingPackages ? "—" : waitingPickup}
            </p>
          </div>

          {/* Delivered packages */}
          <div className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] font-semibold text-[#606060] uppercase tracking-widest">{t("alreadyPickedUp")}</p>
              <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              </div>
            </div>
            <p className="text-[42px] font-bold text-white leading-none">
              {isLoadingPackages ? "—" : alreadyPickedUp}
            </p>
          </div>
        </motion.div>

        {/* ── Packages Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-semibold text-white">{t("myParcels")}</h2>
            <span className="text-[13px] text-[#606060]">{packages.length} {tCommon("loading") ? "" : "paquetes"}</span>
          </div>

          {isLoadingPackages ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : !currentApt && packages.length === 0 ? (
            <div className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center mx-auto">
                <Building2 className="w-7 h-7 text-[#F59E0B]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{t("noAptTitle")}</p>
                <p className="text-xs text-[#606060] mt-1">{t("noAptDesc")}</p>
              </div>
              <button
                onClick={() => {
                  setIsEditingApt(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20 text-sm font-bold hover:bg-[#F59E0B]/25 transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4" aria-hidden="true" />
                {t("noAptButton")}
              </button>
            </div>
          ) : packages.length === 0 ? (
            <div className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-8 text-center">
              <Package className="w-8 h-8 text-[#606060] mx-auto mb-3" />
              <p className="text-[14px] text-[#606060]">{t("emptyTitle")}</p>
              <p className="text-[12px] text-[#606060]/60 mt-1">{t("emptyDesc")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`bg-[#1F1F1F] border rounded-2xl p-5 hover:border-[#6366F1]/25 hover:shadow-[0_0_30px_rgba(99,102,241,0.07)] transition-all duration-200 flex flex-col gap-3 ${
                    pkg.isPerishable
                      ? "border-l-4 border-l-[#EF4444] border-white/[0.08]"
                      : "border-white/[0.08]"
                  }`}
                >
                  {/* TOP ROW: icon + status badge */}
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#6366F1]" />
                    </div>
                    <span className={`text-[11px] font-semibold rounded-full px-3 py-1 ${
                      pkg.status === "PENDING"
                        ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
                        : "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                    }`}>
                      {pkg.status === "PENDING" ? t("statusPending") : t("statusDelivered")}
                    </span>
                  </div>

                  {/* TRACKING CODE */}
                  <div>
                    <p className="text-[11px] text-[#606060] uppercase tracking-wider mb-1">{t("trackingLabel")}</p>
                    <p className="text-[18px] font-bold text-[#6366F1] font-mono">{pkg.trackingCode}</p>
                  </div>

                  {/* DATES */}
                  <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-[#606060] uppercase tracking-wider">{t("arrivedAt")}</p>
                      <p className="text-[12px] text-[#A0A0A0]">
                        {new Date(pkg.createdAt).toLocaleDateString()}{" "}
                        {new Date(pkg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {pkg.status === "DELIVERED" && pkg.pickedUpAt && (
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">{t("pickedUpAt")}</p>
                        <p className="text-[12px] font-semibold text-[#10B981]">
                          {new Date(pkg.pickedUpAt).toLocaleDateString()}{" "}
                          {new Date(pkg.pickedUpAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    )}
                    {pkg.isPerishable && (
                      <span className="inline-flex items-center gap-1.5 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 text-[10px] font-bold rounded-full px-3 py-1">
                        {t("perishableBadge")}
                      </span>
                    )}
                  </div>

                  {/* VER QR BUTTON */}
                  <button
                    onClick={() => setQrModal({ packageId: pkg.id, trackingCode: pkg.trackingCode })}
                    className="mt-auto w-full border border-white/[0.12] text-[#A0A0A0] hover:text-white hover:border-[#6366F1]/40 rounded-full px-4 py-2 text-[13px] font-medium transition-colors bg-transparent cursor-pointer flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    {tCommon("viewQR")}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Claims Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-semibold text-white">{t("myClaims")}</h2>
            <button
              onClick={() => setShowClaimForm(true)}
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full px-5 py-2 text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t("createClaim")}
            </button>
          </div>

          {/* Claims list */}
          {isLoadingClaims ? (
            <div className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-6 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-[#606060]" />
              <span className="text-sm text-[#606060]">{tCommon("loading")}</span>
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-[#606060] mx-auto mb-3" />
              <p className="text-[14px] text-[#606060]">{t("noClaims")}</p>
              <button
                onClick={() => setShowClaimForm(true)}
                className="mt-4 inline-flex items-center gap-2 bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 rounded-full px-4 py-2 text-[13px] font-medium hover:bg-[#6366F1]/20 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("createClaim")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim, index) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl px-6 py-4 flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[11px] font-semibold rounded-full px-3 py-1 ${
                        claim.status === "OPEN"
                          ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
                          : claim.status === "RESOLVED"
                          ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                          : "bg-white/[0.06] text-[#A0A0A0] border border-white/[0.08]"
                      }`}>
                        {claim.type === "WRONG_PACKAGE"
                          ? t("typeWrongPackage")
                          : claim.type === "DAMAGED"
                          ? t("typeDamaged")
                          : claim.type === "MISSING"
                          ? t("typeMissing")
                          : t("typeOther")}
                      </span>
                      <span className={`text-[11px] font-semibold rounded-full px-3 py-1 ${
                        claim.status === "OPEN"
                          ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
                          : claim.status === "RESOLVED"
                          ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                          : "bg-white/[0.06] text-[#A0A0A0] border border-white/[0.08]"
                      }`}>
                        {claim.status}
                      </span>
                      {claim.package?.trackingCode && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 text-[11px] font-mono font-bold">
                          {claim.package.trackingCode}
                        </span>
                      )}
                      <span className="text-[12px] text-[#606060]">
                        {new Date(claim.createdAt).toLocaleDateString()}{" "}
                        {new Date(claim.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {currentApt && ` · ${t("deptLabel")} ${currentApt.number}${currentApt.tower ? ` - ${currentApt.tower}` : ""}`}
                      </span>
                    </div>
                    <p className="text-[14px] text-white">{claim.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Claims Modal ── */}
        <Modal
          open={showClaimForm}
          onClose={() => setShowClaimForm(false)}
          title={t("createClaim")}
          closeAriaLabel={tCommon("qrClose")}
        >
          <form onSubmit={handleCreateClaim} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#606060] uppercase tracking-wider block">
                {t("claimType")}
              </label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#262626] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#6366F1]/50 transition-colors cursor-pointer"
              >
                <option value="WRONG_PACKAGE">{t("typeWrongPackage")}</option>
                <option value="DAMAGED">{t("typeDamaged")}</option>
                <option value="MISSING">{t("typeMissing")}</option>
                <option value="OTHER">{t("typeOther")}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#606060] uppercase tracking-wider block">
                {t("claimPackage")}
              </label>
              <select
                value={claimPackageId}
                onChange={(e) => setClaimPackageId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#262626] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#6366F1]/50 transition-colors cursor-pointer"
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
              <label className="text-xs font-bold text-[#606060] uppercase tracking-wider block">
                {t("claimDescription")}
              </label>
              <textarea
                value={claimDesc}
                onChange={(e) => setClaimDesc(e.target.value)}
                required
                minLength={10}
                rows={4}
                placeholder={t("claimDescPlaceholder")}
                className="w-full bg-[#262626] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-white placeholder-[#606060] outline-none focus:border-[#6366F1]/50 resize-none transition-colors"
              />
              <p className={`text-[10px] font-medium ${claimDesc.length >= 10 ? "text-[#10B981]" : "text-[#606060]"}`}>
                {t("claimMinCharsHint", { count: claimDesc.length })}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowClaimForm(false)}
                className="border border-white/[0.12] text-[#A0A0A0] hover:text-white rounded-full px-5 py-2 text-sm font-medium transition-colors bg-transparent cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={claimDesc.trim().length < 10 || isSubmittingClaim}
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full px-5 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmittingClaim && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t("submitClaim")}
              </button>
            </div>
          </form>
        </Modal>

        {/* ── Notify Concierge Modal ── */}
        <Modal
          open={showNotifyConcierge}
          onClose={() => { setShowNotifyConcierge(false); setNotifySent(false); }}
          title={t("notifyModalTitle")}
          closeAriaLabel={tCommon("qrClose")}
        >
          {notifySent ? (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto" />
              <p className="text-white font-bold">{t("notifySuccessTitle")}</p>
              <p className="text-[#A0A0A0] text-sm">{t("notifySuccessDesc")}</p>
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsNotifying(true);
              try {
                await fetch("/api/notify-concierge", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: session?.user?.name || "",
                    email: session?.user?.email || "",
                    message: notifyMsg,
                  }),
                });
                setNotifySent(true);
              } catch {
                // silent fail
              } finally {
                setIsNotifying(false);
              }
            }} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#606060] uppercase tracking-wider block mb-1.5">
                  {t("notifyMessageLabel")}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={t("notifyMessagePlaceholder")}
                  value={notifyMsg}
                  onChange={e => setNotifyMsg(e.target.value)}
                  className="w-full bg-[#262626] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-white placeholder-[#606060] outline-none focus:border-[#6366F1]/50 resize-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isNotifying}
                className="w-full flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {isNotifying && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("notifySendButton")}
              </button>
            </form>
          )}
        </Modal>

      </main>

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
