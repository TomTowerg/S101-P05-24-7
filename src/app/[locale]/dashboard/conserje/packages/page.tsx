"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search, Filter, X, Package, Clock, CheckCircle2 } from "lucide-react";

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
  const tCommon = useTranslations("DashboardCommon");
  const { status } = useSession();
  const router = useRouter();

  const [packages, setPackages] = useState<PackageData[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

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
        setApartments(data);
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

  if (status === "loading" || (isLoading && packages.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("searchPackages")}</h1>
          <p className="text-slate-500 text-sm font-medium">{t("f1")}</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
        {/* Top Row: Search and Selects */}
        <div className="flex flex-col xl:flex-row gap-4">
          
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="PENDING">{t("statusPENDING")}</option>
              <option value="NOTIFIED">{t("statusNOTIFIED")}</option>
              <option value="DELIVERED">{t("statusDELIVERED")}</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="">{t("allTypes")}</option>
              <option value="standard">{t("typeStandard")}</option>
              <option value="perishable">{t("typePerishable")}</option>
            </select>

            {/* Apartment Filter */}
            <select
              value={apartmentFilter}
              onChange={(e) => setApartmentFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="">{t("allApartments")}</option>
              {apartments.map(apt => (
                <option key={apt.id} value={apt.id}>
                  {apt.number} {apt.tower ? `· ${apt.tower}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom Row: Dates and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t("startDate")}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t("endDate")}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            onClick={clearFilters}
            disabled={!(searchQuery || statusFilter || apartmentFilter || typeFilter || startDate || endDate)}
            className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all w-full sm:w-auto ${
              (searchQuery || statusFilter || apartmentFilter || typeFilter || startDate || endDate)
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-transparent cursor-pointer'
                : 'bg-transparent text-transparent border border-transparent cursor-default pointer-events-none'
            }`}
          >
            <Filter className="w-4 h-4" />
            {t("clearFilters")}
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
        {isSearching && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('tracking')}</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('apt')}</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('status')}</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">{t('receivedBy')}</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.length === 0 && !isSearching ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">{t("noResults")}</p>
                    <button 
                      onClick={clearFilters}
                      className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
                    >
                      {t("clearFilters")}
                    </button>
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4 font-mono text-xs font-bold text-indigo-600 flex items-center gap-2">
                      {pkg.trackingCode}
                      {pkg.isPerishable && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title={t("perishable")} />
                      )}
                    </td>
                    <td className="px-8 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                        {pkg.apartment.number} {pkg.apartment.tower ? `· ${pkg.apartment.tower}` : ''}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <StatusBadge status={pkg.status} t={t} />
                    </td>
                    <td className="px-8 py-4 hidden md:table-cell">
                      {pkg.receiverName ? (
                        <span className="text-xs font-semibold text-slate-700">{pkg.receiverName}</span>
                      ) : (
                        <span className="text-xs text-slate-300 font-medium">—</span>
                      )}
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
