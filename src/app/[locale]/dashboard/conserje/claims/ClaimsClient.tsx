"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  AlertCircle, ArrowLeft, Loader2,
  Package, Clock, CheckCircle2,
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

export default function ClaimsClient() {
  const t = useTranslations("Claims");
  const tCommon = useTranslations("DashboardCommon");
  const router = useRouter();
  const { data: session } = useSession();
  const isConcierge = (session?.user as any)?.role === "CONSERJE";

  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
