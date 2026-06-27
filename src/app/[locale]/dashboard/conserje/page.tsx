/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/routing";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import PackageRegistrationForm from "@/components/PackageRegistrationForm";
import PackageVerificationModal from "@/components/PackageVerificationModal";
import ApartmentManager from "@/components/ApartmentManager";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Package, Clock, CheckCircle2, History, User, QrCode,
  BarChart2, AlertCircle, ArrowRight, Building2, Search, ChevronDown,
} from "lucide-react";
import QRModal from "@/components/QRModal";

const QRScanner = dynamic(() => import("@/components/QRScanner"), { ssr: false });

interface PackageData {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  pickedUpAt: string | null;
  receiverName: string | null;
  isPerishable: boolean;
  apartment: {
    number: string;
    tower: string | null;
  };
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export default function ConciergeDashboard() {
  const t = useTranslations("Concierge");
  const tCommon = useTranslations("DashboardCommon");
  const { data: session, status } = useSession();
  const router = useRouter();

  usePushSubscription();

  const [packages, setPackages] = useState<PackageData[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [qrModal, setQrModal] = useState<{ packageId: string; trackingCode: string } | null>(null);
  const [aptOpen, setAptOpen] = useState(false);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/packages");
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoadingPackages(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchPackages();
    }
  }, [status, router, fetchPackages]);

  const handleScanSuccess = (decodedText: string) => {
    setScannedId(decodedText);
    setIsScanning(false);
    setShowVerification(true);
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

  // Calculate stats
  const totalParcels = packages.length;
  const pendingDelivery = packages.filter(p => p.status !== "DELIVERED").length;
  const deliveredToday = packages.filter(p => {
    const today = new Date().toDateString();
    const pkgDate = new Date(p.createdAt).toDateString();
    return p.status === "DELIVERED" && today === pkgDate;
  }).length;

  const statCards = [
    {
      label: t("totalParcels"),
      value: totalParcels,
      icon: Package,
      color: "#6366F1",
    },
    {
      label: t("pendingDelivery"),
      value: pendingDelivery,
      icon: Clock,
      color: "#F59E0B",
    },
    {
      label: t("deliveredToday"),
      value: deliveredToday,
      icon: CheckCircle2,
      color: "#10B981",
    },
    {
      label: t("navReclamos"),
      value: 0,
      icon: AlertCircle,
      color: "#EF4444",
    },
  ];

  return (
    <div className="min-h-screen bg-[#141414] text-white px-6 py-8 space-y-8 pb-24 md:pb-8">

      {/* ── Header ──────────────────────────────── */}
      <motion.div
        {...fadeUp}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-[32px] sm:text-[36px] font-bold text-white leading-none mb-2">
            {t("welcome")}, {session?.user?.name?.split(" ")[0] ?? ""}
          </h1>
          <p className="text-[15px] text-[#A0A0A0]">
            {new Date().toLocaleDateString("es-CL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => setIsScanning(true)}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors cursor-pointer shrink-0 self-start"
        >
          <QrCode className="w-4 h-4" aria-hidden="true" />
          {tCommon("scan")}
        </button>
      </motion.div>

      {/* ── Stat Cards ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {isLoadingPackages
          ? [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl p-6 hover:scale-[1.01] transition-transform cursor-default"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[11px] font-semibold text-[#606060] uppercase tracking-widest leading-tight">
                      {card.label}
                    </p>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${card.color}1A` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                  </div>
                  <p className="text-[42px] font-bold text-white leading-none">
                    {card.value}
                  </p>
                </div>
              );
            })}
      </motion.div>

      {/* ── Quick Navigation ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          {
            href: "/dashboard/conserje/packages",
            icon: <Package className="w-5 h-5 text-[#6366F1]" />,
            bg: "bg-[#6366F1]/10 border-[#6366F1]/20",
            label: t("navPaquetes"),
            desc: t("quickNavPackagesDesc"),
          },
          {
            href: "/dashboard/conserje/reports",
            icon: <BarChart2 className="w-5 h-5 text-[#10B981]" />,
            bg: "bg-[#10B981]/10 border-[#10B981]/20",
            label: t("navReportes"),
            desc: t("quickNavReportsDesc"),
          },
          {
            href: "/dashboard/conserje/claims",
            icon: <AlertCircle className="w-5 h-5 text-[#F59E0B]" />,
            bg: "bg-[#F59E0B]/10 border-[#F59E0B]/20",
            label: t("navReclamos"),
            desc: t("quickNavClaimsDesc"),
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-4 p-4 bg-[#1F1F1F] border border-white/[0.08] rounded-2xl hover:border-white/[0.16] hover:bg-[#262626] transition-all cursor-pointer"
          >
            <div className={`p-2.5 rounded-xl border ${item.bg} shrink-0 group-hover:scale-105 transition-transform`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{item.label}</p>
              <p className="text-xs text-[#606060] truncate">{item.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#606060] group-hover:text-[#6366F1] group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
          </Link>
        ))}
      </motion.div>

      {/* ── Main 2-column ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6"
      >
        {/* Recent packages table */}
        <div className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-[#606060]" aria-hidden="true" />
              <h2 className="text-[18px] font-semibold text-white">{t("recentPackages")}</h2>
              {!isLoadingPackages && packages.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 text-[10px] font-bold tabular-nums">
                  {packages.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#262626] rounded-xl px-3 py-2 border border-white/[0.08]">
                <Search className="w-3.5 h-3.5 text-[#606060] shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  className="bg-transparent text-[13px] text-white placeholder:text-[#606060] outline-none w-32"
                />
              </div>
              <Link
                href="/dashboard/conserje/packages"
                className="flex items-center gap-1 text-xs text-[#606060] hover:text-[#6366F1] transition-colors font-medium shrink-0"
              >
                {t("viewAll")}
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-3 text-[11px] font-semibold text-[#606060] uppercase tracking-widest">{t("tracking")}</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-[#606060] uppercase tracking-widest">{t("apt")}</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-[#606060] uppercase tracking-widest">{t("status")}</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-[#606060] uppercase tracking-widest hidden md:table-cell">{t("receivedBy")}</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-[#606060] uppercase tracking-widest">{t("date")}</th>
                  <th className="px-6 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {isLoadingPackages ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} aria-hidden="true">
                      <td className="px-6 py-4"><div className="h-4 w-28 animate-pulse bg-white/[0.06] rounded-md" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-16 animate-pulse bg-white/[0.06] rounded-lg" /></td>
                      <td className="px-6 py-4"><div className="h-5 w-20 animate-pulse bg-white/[0.06] rounded-full" /></td>
                      <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 w-24 animate-pulse bg-white/[0.06] rounded-md" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse bg-white/[0.06] rounded-md" /></td>
                      <td className="px-6 py-4" />
                    </tr>
                  ))
                ) : packages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <EmptyState icon={Package} title={t("noPackages")} />
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg, index) => (
                    <motion.tr
                      key={pkg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer h-[56px]"
                      style={{ backgroundColor: index % 2 === 1 ? "rgba(255,255,255,0.01)" : "transparent" }}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-[13px] font-semibold text-[#6366F1]">{pkg.trackingCode}</span>
                        {pkg.isPerishable && (
                          <span
                            aria-label={t("perishable")}
                            className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          >
                            {t("perishable")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-[#262626] rounded-lg text-xs font-bold text-white border border-white/[0.08]">
                          {pkg.apartment.number}{pkg.apartment.tower ? ` · ${pkg.apartment.tower}` : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={pkg.status} t={t} />
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        {pkg.receiverName ? (
                          <span className="text-[13px] font-semibold text-white">{pkg.receiverName}</span>
                        ) : (
                          <span className="text-[13px] text-[#606060] font-medium">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] text-[#A0A0A0] font-medium whitespace-nowrap">
                            {new Date(pkg.createdAt).toLocaleDateString()}{" "}
                            {new Date(pkg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {pkg.status === "DELIVERED" && pkg.pickedUpAt && (
                            <span className="text-[10px] text-[#10B981] font-semibold whitespace-nowrap">
                              ↩ {new Date(pkg.pickedUpAt).toLocaleDateString()}{" "}
                              {new Date(pkg.pickedUpAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setQrModal({ packageId: pkg.id, trackingCode: pkg.trackingCode })}
                          className="p-1.5 rounded-lg text-[#606060] hover:text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors cursor-pointer"
                          aria-label={t("viewQRAriaLabel")}
                        >
                          <QrCode className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registration form */}
        <div className="self-start sticky top-8">
          <PackageRegistrationForm onSuccess={fetchPackages} />
        </div>
      </motion.div>

      {/* ── Apartment management ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#1F1F1F] border border-white/[0.08] rounded-2xl overflow-hidden"
      >
        <button
          onClick={() => setAptOpen(!aptOpen)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-[#606060]" aria-hidden="true" />
            <h2 className="text-[18px] font-semibold text-white">{t("aptManagementTitle")}</h2>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#606060] transition-transform duration-200 ${aptOpen ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {aptOpen && (
            <motion.div
              key="apt-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-2 border-t border-white/[0.08]">
                <ApartmentManager />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Scanner Overlay ──────────────────────── */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onClose={() => setIsScanning(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showVerification && scannedId && (
        <PackageVerificationModal
          packageId={scannedId}
          onClose={() => {
            setShowVerification(false);
            setScannedId(null);
          }}
          onDeliverySuccess={() => {
            fetchPackages();
          }}
        />
      )}

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

function StatusBadge({ status, t }: { status: string; t: any }) {
  const styles: Record<string, string> = {
    PENDING: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20",
    NOTIFIED: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    DELIVERED: "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${styles[status] || styles.PENDING}`}
    >
      {t(`status${status}`) || status}
    </span>
  );
}
