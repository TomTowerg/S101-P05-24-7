/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import PackageRegistrationForm from "@/components/PackageRegistrationForm";
import PackageVerificationModal from "@/components/PackageVerificationModal";
import ApartmentManager from "@/components/ApartmentManager";
import { motion } from "framer-motion";
import { Loader2, Package, Clock, CheckCircle2, History, User, QrCode } from "lucide-react";

// QRScanner uses browser-only APIs (getUserMedia, document) — must never be SSR'd
const QRScanner = dynamic(() => import("@/components/QRScanner"), { ssr: false });

interface PackageData {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  receiverName: string | null;
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
          
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-8 shadow-xl shadow-indigo-950/20 flex flex-col justify-center items-center text-center">
            <h3 className="text-indigo-100 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">{t('comingSoonTitle')}</h3>
            <button
              onClick={() => setIsScanning(true)}
              className="group relative flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-indigo-900/30 cursor-pointer"
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
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard label={t("totalParcels")} value={isLoadingPackages ? '--' : totalParcels.toString()} icon={<Package className="w-6 h-6" />} color="blue" />
          <StatCard label={t("pendingDelivery")} value={isLoadingPackages ? '--' : pendingDelivery.toString()} icon={<Clock className="w-6 h-6" />} color="amber" />
          <StatCard label={t("deliveredToday")} value={isLoadingPackages ? '--' : deliveredToday.toString()} icon={<CheckCircle2 className="w-6 h-6" />} color="green" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
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
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-text-muted/30 mx-auto" />
                      </td>
                    </tr>
                  ) : packages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-text-muted font-medium italic">
                        {t('noPackages')}
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
                        <td className="px-8 py-4 font-mono text-xs font-bold text-indigo-500">{pkg.trackingCode}</td>
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
        </div>

        {/* Apartment Management */}
        <ApartmentManager />

        {/* Scanner Overlay */}
        {isScanning && (
          <QRScanner 
            onScanSuccess={handleScanSuccess}
            onClose={() => setIsScanning(false)}
          />
        )}

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

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: 'blue' | 'amber' | 'green' }) {
  const styles = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    green: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  };

  return (
    <div className="bg-bg-surface rounded-2xl shadow-sm border border-border-subtle p-8 flex items-center justify-between hover:border-indigo-500/30 transition-theme group">
      <div>
        <p className="text-text-muted text-[10px] font-bold tracking-[0.2em] uppercase mb-1">{label}</p>
        <p className="text-4xl font-black text-text-primary tracking-tighter group-hover:scale-110 transition-transform origin-left">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl border transition-all duration-300 group-hover:rotate-12 ${styles[color]}`}>
        {icon}
      </div>
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
