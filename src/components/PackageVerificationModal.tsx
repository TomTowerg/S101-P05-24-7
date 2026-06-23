"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Package,
  MapPin,
  Calendar,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Truck,
  ClipboardCheck,
} from "lucide-react";

interface PackageData {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  description: string | null;
  receiverName: string | null;
  pickedUpAt: string | null;
  apartment: {
    number: string;
    tower: string | null;
  };
}

interface PackageVerificationModalProps {
  packageId: string;
  onClose: () => void;
  onDeliverySuccess: () => void;
}

export default function PackageVerificationModal({
  packageId,
  onClose,
  onDeliverySuccess,
}: PackageVerificationModalProps) {
  const t = useTranslations("VerificationModal");
  const tConcierge = useTranslations("Concierge");

  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [delivering, setDelivering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState("");

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/packages/${packageId}`);
        if (!res.ok) throw new Error("not_found");
        const data = await res.json();
        setPkg(data);
      } catch {
        setError(t("errorNotFound"));
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [packageId, t]);

  const handleDeliver = async () => {
    if (!receiverName.trim()) {
      setError(t("errorReceiverRequired"));
      return;
    }

    try {
      setDelivering(true);
      setError(null);
      const res = await fetch(`/api/packages/${packageId}/deliver`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverName }),
      });

      if (res.ok) {
        toast.success(t("deliveryConfirmed"));
        onDeliverySuccess();
        onClose();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to deliver");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("errorNotFound");
      setError(message);
    } finally {
      setDelivering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-bg-surface w-full max-w-sm md:max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-400 transition-theme">

        {/* Header */}
        <div className="relative h-32 bg-indigo-600 flex items-center justify-center">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-2 transition-colors"
              aria-label={t("close")}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20">
            <Package className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="p-4 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-text-muted font-medium">{t("loadingText")}</p>
            </div>
          ) : error && !pkg ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className="bg-red-500/10 p-4 rounded-full">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-text-primary">{t("errorTitle")}</h4>
                <p className="text-text-muted text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={onClose}
                className="w-full mt-4 py-3 bg-bg-base text-text-primary font-bold rounded-xl hover:bg-bg-surface transition-colors cursor-pointer"
              >
                {t("close")}
              </button>
            </div>
          ) : pkg ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">
                  {t("title")}
                </h3>
                <p className="text-indigo-500 font-mono text-sm font-bold mt-1">
                  {pkg.trackingCode}
                </p>
              </div>

              {/* Package info grid */}
              <div className="grid grid-cols-1 gap-4 bg-bg-base p-6 rounded-2xl border border-border-subtle">
                {/* Location */}
                <div className="flex items-center gap-4">
                  <div className="bg-bg-surface p-2 rounded-lg shadow-sm border border-border-subtle">
                    <MapPin className="w-4 h-4 text-text-muted/60" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      {t("location")}
                    </p>
                    <p className="font-bold text-text-primary">
                      {t("apt")} {pkg.apartment.number}
                      {pkg.apartment.tower
                        ? ` · ${t("tower")} ${pkg.apartment.tower}`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Received date + time */}
                <div className="flex items-center gap-4">
                  <div className="bg-bg-surface p-2 rounded-lg shadow-sm border border-border-subtle">
                    <Calendar className="w-4 h-4 text-text-muted/60" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      {t("receivedSince")}
                    </p>
                    <p className="font-bold text-text-primary">
                      {new Date(pkg.createdAt).toLocaleDateString()}{" "}
                      <span className="text-text-muted font-semibold">
                        {new Date(pkg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Pickup date + time (only when DELIVERED) */}
                {pkg.status === "DELIVERED" && pkg.pickedUpAt && (
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/10 p-2 rounded-lg shadow-sm border border-emerald-500/20">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        {t("pickedUpAtLabel")}
                      </p>
                      <p className="font-bold text-emerald-500">
                        {new Date(pkg.pickedUpAt).toLocaleDateString()}{" "}
                        <span className="font-semibold">
                          {new Date(pkg.pickedUpAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Description (optional) */}
                {pkg.description && (
                  <div className="flex items-center gap-4">
                    <div className="bg-bg-surface p-2 rounded-lg shadow-sm border border-border-subtle">
                      <Truck className="w-4 h-4 text-text-muted/60" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        {t("description")}
                      </p>
                      <p className="font-bold text-text-primary text-sm">
                        {pkg.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Already delivered: show who picked it up */}
                {pkg.status === "DELIVERED" && pkg.receiverName && (
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500/10 p-2 rounded-lg shadow-sm border border-green-500/20">
                      <ClipboardCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        {tConcierge("receivedBy")}
                      </p>
                      <p className="font-bold text-green-500 text-sm">
                        {pkg.receiverName}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {pkg.status === "DELIVERED" ? (
                  <button
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-2xl border border-green-500/25 font-bold transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {t("alreadyDelivered")} — {t("close")}
                  </button>
                ) : (
                  <>
                    {/* Error inline (when package loaded but action failed) */}
                    {error && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="receiverName"
                        className="text-xs font-bold text-text-muted uppercase tracking-wider"
                      >
                        {t("receiverLabel")}
                      </label>
                      <input
                        type="text"
                        id="receiverName"
                        value={receiverName}
                        onChange={(e) => {
                          setReceiverName(e.target.value);
                          setError(null);
                        }}
                        placeholder={t("receiverPlaceholder")}
                        className="w-full px-4 py-3 bg-bg-base border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow text-text-primary placeholder-text-muted/40"
                        disabled={delivering}
                        onKeyDown={(e) => e.key === "Enter" && handleDeliver()}
                      />
                    </div>

                    <button
                      onClick={handleDeliver}
                      disabled={delivering || !receiverName.trim()}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-950/20 transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      {delivering ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {t("confirming")}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          {t("confirmButton")}
                        </>
                      )}
                    </button>
                  </>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-4 bg-transparent text-text-muted hover:text-text-primary font-bold rounded-2xl transition-colors text-sm cursor-pointer"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
