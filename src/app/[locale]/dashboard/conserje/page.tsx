"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import PackageRegistrationForm from "@/components/PackageRegistrationForm";
import QRScanner from "@/components/QRScanner";
import PackageVerificationModal from "@/components/PackageVerificationModal";
import { Loader2, LogOut, Package, Clock, CheckCircle2, History, User, QrCode } from "lucide-react";

interface PackageData {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">{tCommon('loading')}</p>
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
    <div className="min-h-screen bg-[#f8fafc] pt-[68px]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("title")}</h1>
              <p className="text-slate-500 text-sm font-medium">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all duration-200 text-sm"
          >
            <LogOut className="w-4 h-4" />
            {t("signOut").toUpperCase()}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Welcome Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-center gap-6">
            <div className="relative">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-20 h-20 rounded-2xl border-2 border-slate-100 object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-slate-50">
                  <User className="w-10 h-10 text-slate-300" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t("welcome")}, {session?.user?.name || 'Conserje'}!
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-500 text-sm font-medium">{session?.user?.email}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-100">
                  CONSERJE
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-8 shadow-xl shadow-indigo-100 flex flex-col justify-center items-center text-center">
            <h3 className="text-indigo-100 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">{t('comingSoonTitle')}</h3>
            <button
              onClick={() => setIsScanning(true)}
              className="group relative flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-indigo-200"
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
          <div className="xl:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-800 text-lg">{t('recentPackages')}</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('tracking')}</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('apt')}</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('status')}</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingPackages ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-10 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-200 mx-auto" />
                      </td>
                    </tr>
                  ) : packages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                        {t('noPackages')}
                      </td>
                    </tr>
                  ) : (
                    packages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 font-mono text-xs font-bold text-indigo-600">{pkg.trackingCode}</td>
                        <td className="px-8 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                            {pkg.apartment.number} {pkg.apartment.tower ? `· ${pkg.apartment.tower}` : ''}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <StatusBadge status={pkg.status} t={t} />
                        </td>
                        <td className="px-8 py-4 text-xs text-slate-400 font-medium">
                          {new Date(pkg.createdAt).toLocaleDateString()} {new Date(pkg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
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
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: 'blue' | 'amber' | 'green' }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    green: 'bg-green-50 text-green-600 border-green-100'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-center justify-between hover:border-indigo-200 transition-colors group">
      <div>
        <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-1">{label}</p>
        <p className="text-4xl font-black text-slate-900 tracking-tighter group-hover:scale-110 transition-transform origin-left">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl border transition-all duration-300 group-hover:rotate-12 ${styles[color]}`}>
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string, t: any }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
    NOTIFIED: 'bg-blue-50 text-blue-600 border-blue-100',
    DELIVERED: 'bg-green-50 text-green-600 border-green-200'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.PENDING}`}>
      {t(`status${status}`) || status}
    </span>
  );
}
