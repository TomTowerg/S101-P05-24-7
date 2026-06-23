/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import PackageRegistrationForm from "@/components/PackageRegistrationForm";
import PackageVerificationModal from "@/components/PackageVerificationModal";
import ApartmentManager from "@/components/ApartmentManager";
import EmptyState from "@/components/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Package, Clock, CheckCircle2, History, User, QrCode, Flame } from "lucide-react";
import StatCard from "@/components/ui/StatCard";

// QRScanner uses browser-only APIs (getUserMedia, document) — must never be SSR'd
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
    <div className="p-6 md:p-10 space-y-10 pb-24 md:pb-10">
        
        {/* Welcome Section */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="lg:col-span-2 bg-bg-surface rounded-2xl shadow-sm border border-border-subtle p-8 flex items-center gap-6 transition-theme">
            <div className="relative">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-20 h-20 rounded-2xl border-2 border-border-subtle object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-bg-base flex items-center justify-center border-2 border-border-subtle">
                  <User className="w-10 h-10 text-text-muted/40" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-bg-surface rounded-full transition-colors duration-300" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                {t("welcome")}, {session?.user?.name || 'Conserje'}!
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-text-muted text-sm font-medium">{session?.user?.email}</span>
                <span className="w-1 h-1 bg-text-muted/40 rounded-full" />
                <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-500 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-500/30">
                  CONSERJE
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-8 shadow-xl glow-indigo flex flex-col justify-center items-center text-center">
            <h3 className="text-indigo-100 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">{t('comingSoonTitle')}</h3>
            <button
              onClick={() => setIsScanning(true)}
              className="group relative flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-indigo-900/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700"
            >
              <QrCode className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {tCommon('scan').toUpperCase()}
              <div className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </div>
            </button>
            <p className="mt-4 text-indigo-200/60 text-[9px] font-bold uppercase tracking-widest">{t('f3')}</p>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {isLoadingPackages ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-bg-surface rounded-2xl shadow-sm border border-border-subtle p-8 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-2.5 w-24 animate-shimmer rounded" />
                    <div className="h-8 w-16 animate-shimmer rounded" />
                  </div>
                  <div className="h-14 w-14 animate-shimmer rounded-2xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard label={t("totalParcels")} value={totalParcels.toString()} icon={<Package className="w-6 h-6" />} color="blue" />
              <StatCard label={t("pendingDelivery")} value={pendingDelivery.toString()} icon={<Clock className="w-6 h-6" />} color="amber" />
              <StatCard label={t("deliveredToday")} value={deliveredToday.toString()} icon={<CheckCircle2 className="w-6 h-6" />} color="green" />
            </div>
          )}
        </motion.div>

        <motion.div
          className="grid grid-cols-1 xl:grid-cols-12 gap-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Recent History Table */}
          <div className="xl:col-span-8 bg-bg-surface rounded-2xl shadow-sm border border-border-subtle overflow-hidden flex flex-col transition-theme">
            <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-bg-base/30">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-text-muted/60" />
                <h3 className="font-bold text-text-primary text-lg">{t('recentPackages')}</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg-base/60 border-b border-border-subtle">
                    <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('tracking')}</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('apt')}</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('status')}</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest hidden md:table-cell">{t('receivedBy')}</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {isLoadingPackages ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} aria-hidden="true">
                        <td className="px-8 py-4"><div className="h-4 w-28 animate-shimmer rounded-md" /></td>
                        <td className="px-8 py-4"><div className="h-7 w-16 animate-shimmer rounded-lg" /></td>
                        <td className="px-8 py-4"><div className="h-5 w-20 animate-shimmer rounded-full" /></td>
                        <td className="px-8 py-4 hidden md:table-cell"><div className="h-4 w-24 animate-shimmer rounded-md" /></td>
                        <td className="px-8 py-4"><div className="h-4 w-20 animate-shimmer rounded-md" /></td>
                      </tr>
                    ))
                  ) : packages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8">
                        <EmptyState
                          icon={Package}
                          title={t("noPackages")}
                        />
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
                        <td className="px-8 py-4">
                          <span className="font-mono text-xs font-bold text-indigo-400 glow-text-indigo">{pkg.trackingCode}</span>
                          {pkg.isPerishable && (
                            <span
                              aria-label={t("perishable")}
                              className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            >
                              <Flame className="w-3 h-3" aria-hidden="true" />
                              {t("perishable")}
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-4">
                          <span className="px-2.5 py-1 bg-bg-base rounded-lg text-xs font-bold text-text-primary border border-border-subtle">
                            {pkg.apartment.number} {pkg.apartment.tower ? `· ${pkg.apartment.tower}` : ''}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <StatusBadge status={pkg.status} t={t} />
                        </td>
                        <td className="px-8 py-4 hidden md:table-cell">
                          {pkg.receiverName ? (
                            <span className="text-xs font-semibold text-text-primary">{pkg.receiverName}</span>
                          ) : (
                            <span className="text-xs text-text-muted/40 font-medium">—</span>
                          )}
                        </td>
                        <td className="px-8 py-4 text-xs text-text-muted/60 font-medium">
                          {new Date(pkg.createdAt).toLocaleDateString()} {new Date(pkg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Registration Form Column */}
          <div className="xl:col-span-4 self-start sticky top-[88px]">
            <PackageRegistrationForm onSuccess={fetchPackages} />
          </div>
        </motion.div>

        {/* Apartment Management */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <ApartmentManager />
        </motion.div>

        {/* Scanner Overlay */}
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
              fetchPackages(); // Refresh the list
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
