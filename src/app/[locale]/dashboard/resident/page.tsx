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
import { Bell, BellOff, Loader2, LogOut, Package, Clock, CheckCircle2, Info, Edit2, X, Check, AlertCircle, Plus, ChevronDown } from "lucide-react";

export default function ResidentDashboard() {
  const t = useTranslations("Resident");
  const tCommon = useTranslations("DashboardCommon");
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  
  // Apartment Edit State
  const [isEditingApt, setIsEditingApt] = useState(false);
  const [aptNumber, setAptNumber] = useState("");
  const [tower, setTower] = useState("");
  const [isSavingApt, setIsSavingApt] = useState(false);

  const { 
    isSubscribed, 
    isSupported, 
    isLoading: isPushLoading, 
    subscribe, 
    unsubscribe 
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
        body: JSON.stringify({ description: claimDesc, type: claimType, packageId: claimPackageId || undefined }),
      });
      if (res.ok) {
        const newClaim = await res.json();
        setClaims(prev => [newClaim, ...prev]);
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
        await updateSession(); // Refresh session data from server
        await fetchPackages(); // Refresh packages for new apartment
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
          <Loader2 className="h-10 w-10 animate-spin text-[#f59e0b] mx-auto mb-4" />
          <p className="text-text-primary/60 font-medium tracking-wide">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  const currentApt = (session?.user as any)?.apartment;

  // Stats calculation
  const totalParcels = packages.length;
  const waitingPickup = packages.filter(p => p.status !== 'DELIVERED').length;
  const alreadyPickedUp = packages.filter(p => p.status === 'DELIVERED').length;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-[#f59e0b] selection:text-[#09090b] pt-[68px] transition-theme">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f59e0b] rounded-full blur-[120px] -mr-40 -mt-40 opacity-[0.03]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] -ml-40 -mb-40 opacity-[0.03]" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-border-subtle bg-bg-surface/50 backdrop-blur-md transition-theme">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight sm:text-3xl">
              {t('title')}
            </h1>
            <p className="text-text-primary/40 mt-1 text-sm sm:text-base">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-bg-surface/10 hover:bg-bg-surface/20 text-text-primary/70 hover:text-text-primary rounded-xl border border-border-subtle font-semibold transition-all duration-200 cursor-pointer"
            >
              <span className="text-xs uppercase tracking-widest">Profile</span>
            </button>
            <button
              onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl border border-red-500/20 font-semibold transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest">{t('signOut')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* Profile & Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Welcome/Profile Card */}
          <div className="lg:col-span-8 bg-bg-surface/40 backdrop-blur-xl rounded-2xl border border-border-subtle p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-2xl transition-theme">
            <div className="relative">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl border-2 border-[#f59e0b]/20 object-cover shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border-2 border-indigo-600/20 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-indigo-400">
                    {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#34A853] border-4 border-bg-surface rounded-full shadow-md" />
            </div>
            
            <div className="text-center sm:text-left space-y-1 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                {t('welcome')}, {session?.user?.name || 'Usuario'}
              </h2>
              <p className="text-text-primary/40 text-sm">{session?.user?.email}</p>
              
              <div className="pt-4 flex flex-wrap justify-center sm:justify-start items-center gap-3">
                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  {t('role')}: RESIDENTE
                </span>
                
                {isEditingApt ? (
                   <form onSubmit={handleUpdateApartment} className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <input 
                      autoFocus
                      className="bg-bg-surface/30 border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-[#f59e0b]/50 w-24"
                      placeholder={t('aptPlaceholder')}
                      value={aptNumber}
                      onChange={e => setAptNumber(e.target.value)}
                      required
                    />
                    <input 
                      className="bg-bg-surface/30 border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-[#f59e0b]/50 w-24"
                      placeholder={t('towerPlaceholderShort')}
                      value={tower}
                      onChange={e => setTower(e.target.value)}
                    />
                    <button type="submit" disabled={isSavingApt} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer">
                      {isSavingApt ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>}
                    </button>
                    <button type="button" onClick={() => setIsEditingApt(false)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer">
                      <X className="w-3 h-3"/>
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-full text-[10px] font-bold text-[#f59e0b] uppercase tracking-widest">
                      DEPTO: { currentApt ? `${currentApt.number}${currentApt.tower ? ` - ${currentApt.tower}` : ''}` : "--" }
                    </span>
                    <button 
                      onClick={() => {
                        setAptNumber(currentApt?.number || "");
                        setTower(currentApt?.tower || "");
                        setIsEditingApt(true);
                      }}
                      className="p-1.5 bg-bg-surface/10 text-text-primary/40 hover:text-text-primary hover:bg-bg-surface/20 rounded-lg transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Web Push Toggle Card */}
          <div className="lg:col-span-4 bg-bg-surface/40 backdrop-blur-xl rounded-2xl border border-border-subtle p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group transition-theme">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-[#f59e0b]/10 rounded-full blur-2xl group-hover:bg-[#f59e0b]/20 transition-all duration-500" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-green-500/10' : 'bg-[#f59e0b]/10'}`}>
                  {isSubscribed ? <Bell className="w-4 h-4 text-green-400" /> : <BellOff className="w-4 h-4 text-[#f59e0b]" />}
                </div>
                <h3 className="font-bold text-text-primary text-sm tracking-wide uppercase">{t('pushTitle')}</h3>
              </div>
              <p className="text-text-primary/30 text-xs leading-relaxed">
                {t('pushDesc')}
              </p>
            </div>

            <div className="relative z-10 pt-6">
              {!isSupported ? (
                <div className="text-xs text-red-400/60 font-medium flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  {t('pushUnsupported')}
                </div>
              ) : (
                <button
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  disabled={isPushLoading}
                  className={`w-full py-3 rounded-xl font-bold text-[10px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 border cursor-pointer ${
                    isSubscribed 
                      ? 'bg-transparent border-border-subtle text-text-primary/40 hover:text-text-primary hover:border-text-primary/20' 
                      : 'bg-[#f59e0b] border-[#f59e0b] text-[#09090b] hover:bg-[#d97706]'
                  } disabled:opacity-50`}
                >
                  {isPushLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSubscribed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {t('pushEnabled')}
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      {t('pushDisabled')}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard 
            label={t('myParcels')} 
            value={isLoadingPackages ? "--" : totalParcels.toString()} 
            icon={<Package className="w-5 h-5" />} 
            color="indigo" 
          />
          <StatCard 
            label={t('waitingPickup')} 
            value={isLoadingPackages ? "--" : waitingPickup.toString()} 
            icon={<Clock className="w-5 h-5" />} 
            color="amber" 
          />
          <StatCard 
            label={t('alreadyPickedUp')} 
            value={isLoadingPackages ? "--" : alreadyPickedUp.toString()} 
            icon={<CheckCircle2 className="w-5 h-5" />} 
            color="green" 
          />
        </div>

        {/* Parcel List */}
        <div className="space-y-6">
          {isLoadingPackages ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-text-primary/10" />
              <p className="text-text-primary/20 text-sm font-medium tracking-widest uppercase">{tCommon('loading')}</p>
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
                  transition={{ delay: index * 0.05 }}
                  className="bg-bg-surface/60 backdrop-blur-md rounded-2xl border border-border-subtle p-6 shadow-xl hover:border-[#f59e0b]/30 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                      <Package className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                      pkg.status === 'DELIVERED' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    }`}>
                      {pkg.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-primary/30 text-[9px] font-bold uppercase tracking-widest">Seguimiento</p>
                    <h4 className="text-text-primary font-mono font-bold text-lg leading-tight group-hover:text-[#f59e0b] transition-colors">{pkg.trackingCode}</h4>
                  </div>
                  <div className="mt-6 pt-6 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-text-primary/20 text-[10px] font-medium uppercase tracking-tighter">
                      {new Date(pkg.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-text-primary/20 text-[10px] font-medium uppercase tracking-tighter">
                      {new Date(pkg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* My Claims Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-text-primary text-lg tracking-tight flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              {t("myClaims")}
            </h3>
            <button
              onClick={() => setShowClaimForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              {showClaimForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {t("createClaim")}
            </button>
          </div>

          <AnimatePresence>
            {showClaimForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-bg-surface/60 backdrop-blur-md rounded-2xl border border-border-subtle p-6 shadow-xl"
              >
                <form onSubmit={handleCreateClaim} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-primary/40 uppercase tracking-widest block mb-1.5">{t("claimType")}</label>
                    <div className="relative">
                      <select
                        value={claimType}
                        onChange={e => setClaimType(e.target.value)}
                        className="w-full appearance-none bg-bg-base border border-border-subtle text-text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 pr-10"
                      >
                        <option value="WRONG_PACKAGE">{t("typeWrongPackage")}</option>
                        <option value="DAMAGED">{t("typeDamaged")}</option>
                        <option value="MISSING">{t("typeMissing")}</option>
                        <option value="OTHER">{t("typeOther")}</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/30 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-primary/40 uppercase tracking-widest block mb-1.5">{t("claimPackage")}</label>
                    <div className="relative">
                      <select
                        value={claimPackageId}
                        onChange={e => setClaimPackageId(e.target.value)}
                        className="w-full appearance-none bg-bg-base border border-border-subtle text-text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 pr-10"
                      >
                        <option value="">— {t("claimPackage")} —</option>
                        {packages.map(pkg => (
                          <option key={pkg.id} value={pkg.id}>{pkg.trackingCode}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/30 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-primary/40 uppercase tracking-widest block mb-1.5">{t("claimDescription")}</label>
                    <textarea
                      value={claimDesc}
                      onChange={e => setClaimDesc(e.target.value)}
                      required
                      minLength={10}
                      rows={3}
                      placeholder="Describe el problema..."
                      className="w-full bg-bg-base border border-border-subtle text-text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowClaimForm(false)}
                      className="px-5 py-2.5 bg-bg-base border border-border-subtle text-text-primary/40 hover:text-text-primary rounded-xl font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingClaim || claimDesc.trim().length < 10}
                      className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#09090b] rounded-xl font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingClaim && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {t("submitClaim")}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoadingClaims ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-text-primary/20" />
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-bg-surface/40 rounded-2xl border border-border-subtle p-8 text-center">
              <p className="text-text-primary/30 text-sm font-medium">{t("noClaims")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim, index) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-bg-surface/60 backdrop-blur-md rounded-2xl border border-border-subtle p-5 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {claim.type === "WRONG_PACKAGE" ? t("typeWrongPackage")
                            : claim.type === "DAMAGED" ? t("typeDamaged")
                            : claim.type === "MISSING" ? t("typeMissing")
                            : t("typeOther")}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          claim.status === "OPEN" ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : claim.status === "IN_PROGRESS" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-green-500/10 text-green-400 border-green-500/20"
                        }`}>
                          {claim.status === "OPEN" ? t("statusOpen")
                            : claim.status === "IN_PROGRESS" ? t("statusInProgress")
                            : t("statusResolved")}
                        </span>
                        {claim.package && (
                          <span className="px-2.5 py-1 bg-bg-base border border-border-subtle rounded-full text-[10px] font-bold text-text-primary/40 uppercase tracking-wider font-mono">
                            {claim.package.trackingCode}
                          </span>
                        )}
                      </div>
                      <p className="text-text-primary/70 text-sm leading-relaxed">{claim.description}</p>
                      <p className="text-text-primary/20 text-[10px] font-medium uppercase tracking-widest">
                        {new Date(claim.createdAt).toLocaleDateString()} {new Date(claim.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Features Info Bar */}
        <div className="bg-gradient-to-r from-indigo-500/5 via-transparent to-[#f59e0b]/5 rounded-2xl border border-border-subtle p-8 shadow-inner transition-theme">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-text-primary italic">{t('comingSoonTitle')}</h4>
              <p className="text-text-primary/20 text-xs tracking-wide">Desarrollando la mejor experiencia para ti</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[t('f1'), t('f2'), t('f3'), t('f4'), t('f5')].map((f, i) => (
                <span key={i} className="px-4 py-1.5 bg-bg-surface/10 border border-border-subtle rounded-lg text-[10px] font-bold text-text-primary/40 uppercase tracking-widest whitespace-nowrap">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: 'indigo' | 'amber' | 'green' }) {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    amber: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20',
    green: 'text-green-400 bg-green-400/10 border-green-400/20'
  };

  return (
    <div className="bg-bg-surface/40 backdrop-blur-md rounded-2xl border border-border-subtle p-6 shadow-xl hover:bg-bg-surface/60 transition-all duration-300 group">
      <div className="flex items-center justify-between pointer-events-none">
        <div className="space-y-1">
          <p className="text-text-primary/30 text-[10px] font-bold tracking-[0.2em] uppercase">{label}</p>
          <p className="text-3xl font-bold text-text-primary tracking-tight group-hover:scale-110 group-hover:origin-left transition-transform duration-500">{value}</p>
        </div>
        <div className={`p-3 rounded-xl border transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
