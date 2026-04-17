"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Package, CheckCircle, AlertCircle, Loader2, X, PlusCircle } from "lucide-react";
import PackageQR from "./PackageQR";

interface FormState {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  registeredPackage?: {
    id: string;
    trackingCode: string;
    apartment: { number: string; tower?: string | null };
    recipientName?: string | null;
  };
}

const INITIAL_FORM = {
  trackingCode: "",
  apartmentNumber: "",
  tower: "",
  description: "",
  isPerishable: false,
};

export default function PackageRegistrationForm({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("PackageForm");
  const [form, setForm] = useState(INITIAL_FORM);
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setState({ status: "idle", message: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading", message: "" });

    try {
      const response = await fetch("/api/packages/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingCode: form.trackingCode,
          apartmentNumber: form.apartmentNumber,
          tower: form.tower,
          description: form.description,
          isPerishable: form.isPerishable,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState({
          status: "error",
          message: data.error ?? t("errorGeneric"),
        });
        return;
      }

      setState({
        status: "success",
        message: t("successMessage"),
        registeredPackage: data.package,
      });
      setForm(INITIAL_FORM);
      if (onSuccess) onSuccess();
    } catch {
      setState({ status: "error", message: t("errorNetwork") });
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* ── Header (Hidden on success) ────────────────────────────────────── */}
      {state.status !== "success" && (
        <div className="bg-slate-900 px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Package className="w-5 h-5 text-indigo-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">{t("title")}</h2>
            <p className="text-slate-400 text-xs">{t("subtitle")}</p>
          </div>
        </div>
      )}

      {/* ── Success View ──────────────────────────────────────────────────── */}
      {state.status === "success" && state.registeredPackage && (
        <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="max-w-xl mx-auto space-y-8">
            {/* Success Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {state.message}
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                {t("apartmentLabel")}: <span className="text-slate-900 font-bold">{state.registeredPackage.apartment.number}</span>
                {state.registeredPackage.apartment.tower ? ` · ${t("towerLabel")} ${state.registeredPackage.apartment.tower}` : ""}
              </p>
            </div>

            {/* QR Section */}
            <div className="bg-slate-50/50 rounded-3xl p-4 md:p-8 border border-slate-100">
              <PackageQR
                packageId={state.registeredPackage.id}
                trackingCode={state.registeredPackage.trackingCode}
                apartmentNumber={state.registeredPackage.apartment.number}
                recipientName={state.registeredPackage.recipientName || undefined}
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={resetForm}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-6 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
              >
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                {t("submitButton")}
              </button>
              <button
                onClick={() => setState({ status: "idle", message: "" })}
                className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold transition-colors text-xs uppercase tracking-widest"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      {state.status === "error" && (
        <div className="mx-6 mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm flex-1">{state.message}</p>
          <button
            onClick={() => setState({ status: "idle", message: "" })}
            className="text-red-600 hover:text-red-800 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Form ────────────────────────────────────────────────────────────── */}
      {state.status !== "success" && (
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Tracking Code */}
        <div>
          <label
            htmlFor="trackingCode"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {t("trackingCodeLabel")}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="trackingCode"
            name="trackingCode"
            type="text"
            required
            minLength={3}
            value={form.trackingCode}
            onChange={handleChange}
            placeholder={t("trackingCodePlaceholder")}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono transition-shadow"
          />
        </div>

        {/* Apartment + Tower (same row) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="apartmentNumber"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              {t("apartmentLabel")}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="apartmentNumber"
              name="apartmentNumber"
              type="text"
              required
              value={form.apartmentNumber}
              onChange={handleChange}
              placeholder={t("apartmentPlaceholder")}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            />
          </div>
          <div>
            <label
              htmlFor="tower"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              {t("towerLabel")}
              <span className="text-slate-400 text-xs ml-1">
                ({t("optional")})
              </span>
            </label>
            <input
              id="tower"
              name="tower"
              type="text"
              value={form.tower}
              onChange={handleChange}
              placeholder={t("towerPlaceholder")}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {t("descriptionLabel")}
            <span className="text-slate-400 text-xs ml-1">
              ({t("optional")})
            </span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder={t("descriptionPlaceholder")}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
          />
        </div>

        {/* Perishable / Urgent Checkbox */}
        <div className="flex items-start gap-3 p-4 border border-red-100 bg-red-50/50 rounded-lg">
          <div className="flex items-center h-5">
            <input
              id="isPerishable"
              name="isPerishable"
              type="checkbox"
              checked={form.isPerishable}
              onChange={(e) => setForm((prev) => ({ ...prev, isPerishable: e.target.checked }))}
              className="w-4 h-4 text-red-600 bg-white border-red-300 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="isPerishable" className="text-sm font-semibold text-red-900 cursor-pointer">
              {t("perishableLabel")}
            </label>
            <p className="text-xs text-red-700 mt-0.5">{t("perishableDesc")}</p>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
        >
          {state.status === "loading" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("registering")}
            </>
          ) : (
            <>
              <Package className="w-4 h-4" />
              {t("submitButton")}
            </>
          )}
        </button>
      </form>
      )}
    </div>
  );
}
