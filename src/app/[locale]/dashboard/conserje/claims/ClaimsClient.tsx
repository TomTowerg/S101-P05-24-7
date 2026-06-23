"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle, ArrowLeft, Loader2,
  Package, Clock, CheckCircle2, Filter,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";

type ClaimStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
type ClaimType = "WRONG_PACKAGE" | "DAMAGED" | "MISSING" | "OTHER";

interface Claim {
  id: string;
  description: string;
  status: ClaimStatus;
  type: ClaimType;
  createdAt: string;
  packageId: string | null;
  user: { name: string | null; email: string | null };
  package: { trackingCode: string; apartment: { number: string; tower: string | null } } | null;
}

const STATUS_STYLES: Record<ClaimStatus, string> = {
  OPEN:        "bg-red-500/15 text-red-400 border-red-500/30",
  IN_PROGRESS: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  RESOLVED:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const STATUS_ICON: Record<ClaimStatus, React.ReactNode> = {
  OPEN:        <AlertCircle className="w-3.5 h-3.5" />,
  IN_PROGRESS: <Clock className="w-3.5 h-3.5" />,
  RESOLVED:    <CheckCircle2 className="w-3.5 h-3.5" />,
};

const NEXT_STATUS: Record<ClaimStatus, ClaimStatus | null> = {
  OPEN:        "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED:    null,
};

const ease = [0.16, 1, 0.3, 1] as const;

export default function ClaimsClient() {
  const t = useTranslations("Claims");
  const tCommon = useTranslations("DashboardCommon");
  const router = useRouter();
  const { data: session } = useSession();
  const isConcierge = (session?.user as any)?.role === "CONSERJE";

  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/claims");
      if (res.ok) setClaims(await res.json());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleStatusUpdate = async (claimId: string, status: ClaimStatus) => {
    setUpdatingId(claimId);
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setClaims(prev => prev.map(c => c.id === claimId ? updated : c));
        toast.success(t("statusUpdated"));
      } else {
        toast.error(t("errorUpdate"));
      }
    } catch {
      toast.error(t("errorUpdate"));
    } finally {
      setUpdatingId(null);
    }
  };

  const TYPE_LABEL: Record<ClaimType, string> = {
    WRONG_PACKAGE: t("typeWrongPackage"),
    DAMAGED:       t("typeDamaged"),
    MISSING:       t("typeMissing"),
    OTHER:         t("typeOther"),
  };

  const STATUS_LABEL: Record<ClaimStatus, string> = {
    OPEN:        t("statusOpen"),
    IN_PROGRESS: t("statusInProgress"),
    RESOLVED:    t("statusResolved"),
  };

  const filteredClaims = claims.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (typeFilter && c.type !== typeFilter) return false;
    return true;
  });

  const hasActiveFilters = !!(statusFilter || typeFilter);

  const selectStyle = "px-3 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer appearance-none";

  return (
    <div className="min-h-screen bg-bg-base transition-theme">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="bg-bg-surface border-b border-border-subtle transition-theme"
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-950/20 glow-indigo-sm">
              <AlertCircle className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t("title")}</h1>
              <p className="text-text-muted text-sm font-medium">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/conserje")}
            className="px-5 py-2.5 bg-bg-base border border-border-subtle hover:bg-bg-surface text-text-primary rounded-xl font-bold transition-all text-sm flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {tCommon("back")}
          </button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-5">

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
          className="bg-bg-surface border border-border-subtle rounded-2xl p-5 transition-theme"
        >
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className={`w-full ${selectStyle}`}
              >
                <option value="">Todos los estados</option>
                <option value="OPEN">{t("statusOpen")}</option>
                <option value="IN_PROGRESS">{t("statusInProgress")}</option>
                <option value="RESOLVED">{t("statusResolved")}</option>
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                Tipo
              </label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className={`w-full ${selectStyle}`}
              >
                <option value="">Todos los tipos</option>
                <option value="WRONG_PACKAGE">{t("typeWrongPackage")}</option>
                <option value="DAMAGED">{t("typeDamaged")}</option>
                <option value="MISSING">{t("typeMissing")}</option>
                <option value="OTHER">{t("typeOther")}</option>
              </select>
            </div>
            <button
              onClick={() => { setStatusFilter(""); setTypeFilter(""); }}
              disabled={!hasActiveFilters}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                hasActiveFilters
                  ? "bg-bg-base text-text-muted hover:text-text-primary border border-border-subtle hover:border-indigo-500/30"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <Filter className="w-3.5 h-3.5" aria-hidden="true" />
              Limpiar
            </button>
          </div>
          {!isLoading && (
            <p className="text-[11px] text-text-muted font-medium mt-3">
              {filteredClaims.length} reclamo{filteredClaims.length !== 1 ? "s" : ""}
              {hasActiveFilters ? " (filtrado)" : ""}
            </p>
          )}
        </motion.div>

        {/* Claims list */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
        >
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-text-muted/30" aria-label="Cargando" />
            </div>
          ) : filteredClaims.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title={claims.length === 0 ? t("emptyTitle") : "Sin resultados"}
              description={claims.length === 0 ? t("emptyDesc") : "Prueba ajustando los filtros"}
            />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredClaims.map((claim, index) => {
                  const nextStatus = NEXT_STATUS[claim.status];
                  const isResolved = claim.status === "RESOLVED";
                  return (
                    <motion.div
                      key={claim.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: index * 0.04, ease }}
                      className={`bg-bg-surface border border-border-subtle rounded-2xl p-5 md:p-6 shadow-sm hover:border-indigo-500/20 transition-all ${isResolved ? "opacity-60" : ""}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Top row: type + status badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {TYPE_LABEL[claim.type]}
                            </span>
                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[claim.status]}`}>
                              {STATUS_ICON[claim.status]}
                              {STATUS_LABEL[claim.status]}
                            </span>
                            {claim.package && (
                              <span className="flex items-center gap-1 px-2.5 py-1 bg-bg-base border border-border-subtle rounded-full text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                <Package className="w-3 h-3" aria-hidden="true" />
                                {claim.package.trackingCode}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-text-primary text-sm leading-relaxed">{claim.description}</p>

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted font-medium">
                            <span>{claim.user.name || claim.user.email}</span>
                            <span>·</span>
                            <span>
                              {new Date(claim.createdAt).toLocaleDateString()}{" "}
                              {new Date(claim.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {claim.package && (
                              <>
                                <span>·</span>
                                <span>
                                  Depto {claim.package.apartment.number}
                                  {claim.package.apartment.tower ? ` ${claim.package.apartment.tower}` : ""}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status advance button (CONSERJE only) */}
                        {isConcierge && nextStatus && (
                          <button
                            onClick={() => handleStatusUpdate(claim.id, nextStatus)}
                            disabled={updatingId === claim.id}
                            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-bg-base hover:bg-indigo-500/10 hover:text-indigo-400 border border-border-subtle hover:border-indigo-500/30 text-text-muted rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                          >
                            {updatingId === claim.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                              : STATUS_ICON[nextStatus]}
                            {STATUS_LABEL[nextStatus]}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
