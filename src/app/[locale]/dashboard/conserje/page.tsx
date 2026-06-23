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
import { Loader2, Package, Clock, CheckCircle2, History, User, Flame, QrCode, BarChart2, AlertCircle, ArrowRight, Building2 } from "lucide-react";
import StatCard from "@/components/ui/StatCard";

const QRScanner = dynamic(() => import("@/components/QRScanner"), { ssr: false });

interface PackageData {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  receiverName: string | null;
  isPerishable: boolean;
  apartment: {
    number: string;
    tower: string | null;
  };
}

export default function ConciergeDashboard() {
  const t = useTranslations("Concierge");
  const tCommon = useTranslations("DashboardCommon");
  const { data: session, status } = useSession();
  const router = useRouter();

  usePushSubscription(); // auto-requests permission and subscribes silently

  const [packages, setPackages] = useState<PackageData[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-bg-base transition-theme">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-text-muted font-medium">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalParcels = packages.length;
  const pendingDelivery = packages.filter(p => p.status !== 'DELIVERED').length;
  const deliveredToday = packages.filter(p => {
    const today = new Date().toDateString();
    const pkgDate = new Date(p.createdAt).toDateString();
    return p.status === 'DELIVERED' && today === pkgDate;
  }).length;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary transition-theme pt-[68px]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-16">

        {/* ── Welcome ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden transition-theme"
        >
          {/* Accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-transparent" />

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-16 h-16 rounded-2xl border-2 border-border-subtle object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border-2 border-indigo-500/25 flex items-center justify-center">
                  <User className="w-8 h-8 text-indigo-400" aria-hidden="true" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-[3px] border-bg-surface rounded-full" />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div>
                <h1 className="text-xl font-bold text-text-primary tracking-tight">
                  {t("welcome")}, {session?.user?.name?.split(" ")[0] || "Conserje"}
                </h1>
                <p className="text-sm text-text-muted mt-0.5">{session?.user?.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 text-[10px] font-bold uppercase tracking-wider">
                  CONSERJE
                </span>
                {!isLoadingPackages && pendingDelivery > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                    {pendingDelivery} pendiente{pendingDelivery !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* QR Button */}
            <button
              onClick={() => setIsScanning(true)}
              className="group relative flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-950/30 glow-indigo cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700 shrink-0"
            >
              <QrCode className="w-5 h-5 group-hover:rotate-12 transition-transform" aria-hidden="true" />
              {tCommon("scan")}
              <div className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-300" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* ── Stats ────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {isLoadingPackages ? (
            [0, 1, 2].map((i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard label={t("totalParcels")} value={totalParcels.toString()} icon={<Package className="w-6 h-6" />} color="blue" />
              <StatCard label={t("pendingDelivery")} value={pendingDelivery.toString()} icon={<Clock className="w-6 h-6" />} color="amber" />
              <StatCard label={t("deliveredToday")} value={deliveredToday.toString()} icon={<CheckCircle2 className="w-6 h-6" />} color="green" />
            </>
          )}
        </motion.div>

        {/* ── Quick Navigation ─────────────────────── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {[
            {
              href: "/dashboard/conserje/packages",
              icon: <Package className="w-5 h-5 text-indigo-400" />,
              bg: "bg-indigo-500/10 border-indigo-500/20",
              label: "Paquetes",
              desc: "Filtros, búsqueda y gestión completa",
            },
            {
              href: "/dashboard/conserje/reports",
              icon: <BarChart2 className="w-5 h-5 text-emerald-400" />,
              bg: "bg-emerald-500/10 border-emerald-500/20",
              label: "Reportes",
              desc: "Estadísticas y tendencias",
            },
            {
              href: "/dashboard/conserje/claims",
              icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
              bg: "bg-amber-500/10 border-amber-500/20",
              label: "Reclamos",
              desc: "Gestionar casos de residentes",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 p-4 bg-bg-surface border border-border-subtle rounded-2xl hover:border-indigo-500/25 hover:bg-bg-surface-2 transition-all cursor-pointer"
            >
              <div className={`p-2.5 rounded-xl border ${item.bg} shrink-0 group-hover:scale-105 transition-transform`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary">{item.label}</p>
                <p className="text-xs text-text-muted truncate">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted/40 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </motion.div>

        {/* ── Main content: tabla + formulario ─────── */}
        <motion.div
          className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Tabla de paquetes recientes */}
          <div className="xl:col-span-8 bg-bg-surface rounded-2xl border border-border-subtle overflow-hidden flex flex-col transition-theme">
            <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-bg-base/30">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-text-muted/60" aria-hidden="true" />
                <h2 className="font-bold text-text-primary">{t("recentPackages")}</h2>
                {!isLoadingPackages && packages.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 text-[10px] font-bold tabular-nums">
                    {packages.length}
                  </span>
                )}
              </div>
              <Link
                href="/dashboard/conserje/packages"
                className="flex items-center gap-1 text-xs text-text-muted hover:text-indigo-400 transition-colors font-medium"
              >
                Ver todos
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg-base/60 border-b border-border-subtle">
                    <th className="px-6 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("tracking")}</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("apt")}</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("status")}</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-widest hidden md:table-cell">{t("receivedBy")}</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {isLoadingPackages ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} aria-hidden="true">
                        <td className="px-6 py-4"><div className="h-4 w-28 animate-shimmer rounded-md" /></td>
                        <td className="px-6 py-4"><div className="h-6 w-16 animate-shimmer rounded-lg" /></td>
                        <td className="px-6 py-4"><div className="h-5 w-20 animate-shimmer rounded-full" /></td>
                        <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 w-24 animate-shimmer rounded-md" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-20 animate-shimmer rounded-md" /></td>
                      </tr>
                    ))
                  ) : packages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8">
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
                        className="hover:bg-bg-base/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-indigo-400 glow-text-indigo">{pkg.trackingCode}</span>
                          {pkg.isPerishable && (
                            <span
                              aria-label={t("perishable")}
                              className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            >
                              <Flame className="w-3 h-3" aria-hidden="true" />
                              {t("perishable")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-bg-base rounded-lg text-xs font-bold text-text-primary border border-border-subtle">
                            {pkg.apartment.number}{pkg.apartment.tower ? ` · ${pkg.apartment.tower}` : ""}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={pkg.status} t={t} />
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {pkg.receiverName ? (
                            <span className="text-xs font-semibold text-text-primary">{pkg.receiverName}</span>
                          ) : (
                            <span className="text-xs text-text-muted/40 font-medium">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-text-muted/60 font-medium">
                          {new Date(pkg.createdAt).toLocaleDateString()}{" "}
                          {new Date(pkg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formulario de registro */}
          <div className="xl:col-span-4 self-start sticky top-[88px]">
            <PackageRegistrationForm onSuccess={fetchPackages} />
          </div>
        </motion.div>

        {/* ── Gestión de apartamentos ──────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden transition-theme"
        >
          <div className="px-6 py-5 border-b border-border-subtle flex items-center gap-3 bg-bg-base/30">
            <Building2 className="w-5 h-5 text-text-muted/60" aria-hidden="true" />
            <h2 className="font-bold text-text-primary">Gestión de Apartamentos</h2>
          </div>
          <div className="p-6">
            <ApartmentManager />
          </div>
        </motion.div>

      </main>

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
    </div>
  );
}

function StatusBadge({ status, t }: { status: string, t: any }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-text-muted/10 text-text-muted border-text-muted/20',
    NOTIFIED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.PENDING}`}>
      {t(`status${status}`) || status}
    </span>
  );
}
