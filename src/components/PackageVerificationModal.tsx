"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm md:max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-400">

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
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-slate-500 font-medium">{t("loadingText")}</p>
            </div>
          ) : error && !pkg ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className="bg-red-50 p-4 rounded-full">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{t("errorTitle")}</h4>
                <p className="text-slate-500 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={onClose}
                className="w-full mt-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                {t("close")}
              </button>
            </div>
          ) : pkg ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {t("title")}
                </h3>
                <p className="text-indigo-600 font-mono text-sm font-bold mt-1">
                  {pkg.trackingCode}
                </p>
              </div>

              {/* Package info grid */}
              <div className="grid grid-cols-1 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                {/* Location */}
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t("location")}
                    </p>
                    <p className="font-bold text-slate-700">
                      {t("apt")} {pkg.apartment.number}
                      {pkg.apartment.tower
                        ? ` · ${t("tower")} ${pkg.apartment.tower}`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Received date */}
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t("receivedSince")}
                    </p>
                    <p className="font-bold text-slate-700">
                      {new Date(pkg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Description (optional) */}
                {pkg.description && (
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Truck className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {t("description")}
                      </p>
                      <p className="font-bold text-slate-700 text-sm">
                        {pkg.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Already delivered: show who picked it up */}
                {pkg.status === "DELIVERED" && pkg.receiverName && (
                  <div className="flex items-center gap-4">
                    <div className="bg-green-50 p-2 rounded-lg shadow-sm">
                      <ClipboardCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {tConcierge("receivedBy")}
                      </p>
                      <p className="font-bold text-green-700 text-sm">
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
                    className="w-full flex items-center justify-center gap-2 py-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl border border-green-200 font-bold transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {t("alreadyDelivered")} — {t("close")}
                  </button>
                ) : (
                  <>
                    {/* Error inline (when package loaded but action failed) */}
                    {error && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="receiverName"
                        className="text-xs font-bold text-slate-500 uppercase tracking-wider"
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
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-slate-800"
                        disabled={delivering}
                        onKeyDown={(e) => e.key === "Enter" && handleDeliver()}
                      />
                    </div>

                    <button
                      onClick={handleDeliver}
                      disabled={delivering || !receiverName.trim()}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
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
                  className="w-full py-4 bg-white text-slate-400 hover:text-slate-600 font-bold rounded-2xl transition-colors text-sm"
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
