"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle, ArrowLeft, Plus, X, Loader2,
  Package, Clock, CheckCircle2, ChevronDown,
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

interface RecentPackage {
  id: string;
  trackingCode: string;
  apartment: { number: string; tower: string | null };
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

export default function ClaimsClient() {
  const t = useTranslations("Claims");
  const tCommon = useTranslations("DashboardCommon");
  const router = useRouter();
  const { data: session } = useSession();
  const isConcierge = (session?.user as any)?.role === "CONSERJE";

  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [packages, setPackages] = useState<RecentPackage[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<ClaimType>("OTHER");
  const [formDesc, setFormDesc] = useState("");
  const [formPackageId, setFormPackageId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/claims");
      if (res.ok) setClaims(await res.json());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    const res = await fetch("/api/packages");
    if (res.ok) setPackages(await res.json());
  }, []);

  useEffect(() => {
    fetchClaims();
    fetchPackages();
  }, [fetchClaims, fetchPackages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: formDesc, type: formType, packageId: formPackageId || undefined }),
      });
      if (res.ok) {
        const newClaim = await res.json();
        setClaims(prev => [newClaim, ...prev]);
        toast.success(t("claimCreated"));
        setShowForm(false);
        setFormDesc("");
        setFormType("OTHER");
        setFormPackageId("");
      } else {
        toast.error(t("errorCreate"));
      }
    } catch {
      toast.error(t("errorCreate"));
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-bg-base transition-theme">
      {/* Header */}
      <div className="bg-bg-surface border-b border-border-subtle transition-theme">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-950/20">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t("title")}</h1>
              <p className="text-text-muted text-sm font-medium">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {t("newClaim")}
            </button>
            <button
              onClick={() => router.push("/dashboard/conserje")}
              className="px-5 py-2.5 bg-bg-base border border-border-subtle hover:bg-bg-surface text-text-primary rounded-xl font-bold transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {tCommon("back")}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* New Claim Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm"
            >
              <h2 className="font-bold text-text-primary mb-5 text-lg">{t("newClaim")}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type */}
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest block mb-1.5">{t("type")}</label>
                  <div className="relative">
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value as ClaimType)}
                      className="w-full appearance-none bg-bg-base border border-border-subtle text-text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    >
                      <option value="WRONG_PACKAGE">{t("typeWrongPackage")}</option>
                      <option value="DAMAGED">{t("typeDamaged")}</option>
                      <option value="MISSING">{t("typeMissing")}</option>
                      <option value="OTHER">{t("typeOther")}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Package (optional) */}
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest block mb-1.5">{t("package")}</label>
                  <div className="relative">
                    <select
                      value={formPackageId}
                      onChange={e => setFormPackageId(e.target.value)}
                      className="w-full appearance-none bg-bg-base border border-border-subtle text-text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    >
                      <option value="">— {t("package")} —</option>
                      {packages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.trackingCode} · Depto {pkg.apartment.number}{pkg.apartment.tower ? ` ${pkg.apartment.tower}` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest block mb-1.5">{t("description")}</label>
                  <textarea
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    required
                    minLength={10}
                    rows={3}
                    placeholder="Describe el problema con detalle..."
                    className="w-full bg-bg-base border border-border-subtle text-text-primary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 bg-bg-base border border-border-subtle text-text-muted hover:text-text-primary rounded-xl font-bold text-sm transition-colors cursor-pointer"
                  >
                    {tCommon("back")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || formDesc.trim().length < 10}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("submit")}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Claims List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-text-muted/30" />
          </div>
        ) : claims.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
          />
        ) : (
          <div className="space-y-3">
            {claims.map((claim, index) => {
              const nextStatus = NEXT_STATUS[claim.status];
              return (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-bg-surface border border-border-subtle rounded-2xl p-5 md:p-6 shadow-sm hover:border-indigo-500/20 transition-colors"
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
                            <Package className="w-3 h-3" />
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
                        <span>{new Date(claim.createdAt).toLocaleDateString()} {new Date(claim.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {claim.package && (
                          <>
                            <span>·</span>
                            <span>Depto {claim.package.apartment.number}{claim.package.apartment.tower ? ` ${claim.package.apartment.tower}` : ""}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status advance button (CONSERJE only) */}
                    {isConcierge && nextStatus && (
                      <button
                        onClick={() => handleStatusUpdate(claim.id, nextStatus)}
                        disabled={updatingId === claim.id}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-bg-base hover:bg-indigo-500/10 hover:text-indigo-400 border border-border-subtle hover:border-indigo-500/30 text-text-muted rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {updatingId === claim.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : STATUS_ICON[nextStatus]}
                        {STATUS_LABEL[nextStatus]}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
