"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonTable } from "@/components/ui/Skeleton";
import EmptyState from "@/components/EmptyState";
import {
  Loader2, Search, Filter, X, Package, Flame, ChevronRight, QrCode,
} from "lucide-react";
import QRModal from "@/components/QRModal";

interface Apartment {
  id: string;
  number: string;
  tower: string | null;
}

interface PackageData {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  receiverName: string | null;
  isPerishable: boolean;
  apartment: {
    id: string;
    number: string;
    tower: string | null;
  };
}

export default function PackagesPage() {
  const t = useTranslations("Concierge");
  const { status } = useSession();
  const router = useRouter();

  const [packages, setPackages] = useState<PackageData[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [qrModal, setQrModal] = useState<{ packageId: string; trackingCode: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [apartmentFilter, setApartmentFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchApartments = useCallback(async () => {
    try {
      const res = await fetch("/api/apartments");
      if (res.ok) {
        const data = await res.json();
        setApartments(data.sort((a: { number: string }, b: { number: string }) => parseInt(a.number) - parseInt(b.number)));
      }
    } catch (error) {
      console.error("Error fetching apartments:", error);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter) params.append("status", statusFilter);
      if (apartmentFilter) params.append("apartmentId", apartmentFilter);
      if (typeFilter) params.append("type", typeFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/packages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, apartmentFilter, typeFilter, startDate, endDate]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchApartments();
    }
  }, [status, router, fetchApartments]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPackages();
    }
  }, [status, fetchPackages]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setApartmentFilter("");
    setTypeFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = !!(searchQuery || statusFilter || apartmentFilter || typeFilter || startDate || endDate);

  const selectStyle = "w-full px-3 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer appearance-none";

  if (status === "loading" || (isLoading && packages.length === 0)) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <div className="h-8 w-64 animate-shimmer rounded-lg" />
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-11 animate-shimmer rounded-xl" />)}
          </div>
        </div>
        <div className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden">
          <SkeletonTable rows={6} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6 pb-24 md:pb-10">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t("searchPackages")}</h1>
        <p className="text-text-muted text-sm font-medium mt-0.5">{t("f1")}</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="bg-bg-surface border border-border-subtle rounded-2xl p-5 space-y-4 transition-theme"
      >
        <div className="flex flex-col xl:flex-row gap-3">
          {/* Search */}
          <div className="flex-[2] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-9 pr-9 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectStyle}>
            <option value="">{t("allStatuses")}</option>
            <option value="PENDING">{t("statusPENDING")}</option>
            <option value="NOTIFIED">{t("statusNOTIFIED")}</option>
            <option value="DELIVERED">{t("statusDELIVERED")}</option>
          </select>

          {/* Type */}
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectStyle}>
            <option value="">{t("allTypes")}</option>
            <option value="standard">{t("typeStandard")}</option>
            <option value="perishable">{t("typePerishable")}</option>
          </select>

          {/* Apartment */}
          <select value={apartmentFilter} onChange={(e) => setApartmentFilter(e.target.value)} className={selectStyle}>
            <option value="">{t("allApartments")}</option>
            {apartments.map((apt) => (
              <option key={apt.id} value={apt.id}>
                {apt.number}{apt.tower ? ` · ${apt.tower}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex gap-3 w-full sm:w-auto">
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                {t("startDate")}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-bg-base border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                {t("endDate")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-bg-base border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>
          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
              hasActiveFilters
                ? "bg-bg-base text-text-muted hover:text-text-primary border border-border-subtle hover:border-indigo-500/30"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            {t("clearFilters")}
          </button>
        </div>
      </motion.div>

      {/* Results count */}
      {!isLoading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-xs text-text-muted font-medium px-1"
        >
          {isSearching ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t("searching")}
            </span>
          ) : (
            t("resultCount", { count: packages.length })
          )}
        </motion.p>
      )}

      {/* Results table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className={`bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden transition-theme relative ${isSearching ? "opacity-60" : ""}`}
      >
        {isLoading ? (
          <SkeletonTable rows={6} cols={5} />
        ) : packages.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={Package}
              title={t("noResults")}
              action={{ label: t("clearFilters"), onClick: clearFilters }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-base/60 border-b border-border-subtle">
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("tracking")}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("apt")}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("status")}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest hidden md:table-cell">{t("receivedBy")}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("date")}</th>
                  <th className="px-6 py-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {packages.map((pkg, index) => (
                  <motion.tr
                    key={pkg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setSelectedPackage(pkg)}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 glow-text-indigo">
                          {pkg.trackingCode}
                        </span>
                        {pkg.isPerishable && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold">
                            <Flame className="w-2.5 h-2.5" aria-hidden="true" />
                            {t("perishable")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-bg-base rounded-lg text-xs font-bold text-text-primary border border-border-subtle">
                        {pkg.apartment.number}{pkg.apartment.tower ? ` · ${pkg.apartment.tower}` : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={pkg.status as any} />
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {pkg.receiverName ? (
                        <span className="text-xs font-semibold text-text-primary">{pkg.receiverName}</span>
                      ) : (
                        <span className="text-xs text-text-muted/40 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted font-medium whitespace-nowrap">
                      {new Date(pkg.createdAt).toLocaleDateString()}{" "}
                      {new Date(pkg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setQrModal({ packageId: pkg.id, trackingCode: pkg.trackingCode }); }}
                          className="p-1.5 rounded-lg text-text-muted/40 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                          aria-label="Ver QR"
                        >
                          <QrCode className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-text-muted/40 group-hover:text-indigo-400 transition-colors" aria-hidden="true" />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {qrModal && (
        <QRModal
          packageId={qrModal.packageId}
          trackingCode={qrModal.trackingCode}
          open={true}
          onClose={() => setQrModal(null)}
        />
      )}

      {/* Package detail drawer */}
      <AnimatePresence>
        {selectedPackage && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedPackage(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-bg-surface border-l border-border-subtle z-50 flex flex-col overflow-hidden"
              role="complementary"
              aria-label="Detalle del paquete"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25">
                    <Package className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("packageDrawerTitle")}</p>
                    <p className="font-mono text-sm font-bold text-indigo-400 glow-text-indigo">
                      {selectedPackage.trackingCode}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-base transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  aria-label={t("closeDrawerAriaLabel")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {/* Status */}
                <div className="flex items-center justify-between py-4 border-b border-border-subtle">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{t("status")}</span>
                  <StatusBadge status={selectedPackage.status as any} />
                </div>

                {/* Apartment */}
                <div className="flex items-center justify-between py-4 border-b border-border-subtle">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{t("apt")}</span>
                  <span className="px-2.5 py-1 bg-bg-base rounded-lg text-xs font-bold text-text-primary border border-border-subtle">
                    {selectedPackage.apartment.number}
                    {selectedPackage.apartment.tower ? ` · ${selectedPackage.apartment.tower}` : ""}
                  </span>
                </div>

                {/* Receiver */}
                <div className="flex items-center justify-between py-4 border-b border-border-subtle">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{t("receivedBy")}</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {selectedPackage.receiverName || "—"}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center justify-between py-4 border-b border-border-subtle">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{t("date")}</span>
                  <span className="text-sm font-medium text-text-primary">
                    {new Date(selectedPackage.createdAt).toLocaleDateString()}{" "}
                    {new Date(selectedPackage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Perishable */}
                {selectedPackage.isPerishable && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <Flame className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-bold text-red-400 uppercase tracking-wider">{t("perishable")}</p>
                      <p className="text-xs text-text-muted mt-0.5">{t("perishableNote")}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
