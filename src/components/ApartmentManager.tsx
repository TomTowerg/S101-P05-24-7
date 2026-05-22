"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Building2, Plus, Trash2, User, Package, Loader2, X, CheckCircle } from "lucide-react";

interface ApartmentResident {
  id: string;
  name: string | null;
  email: string | null;
}

interface ApartmentRow {
  id: string;
  number: string;
  tower: string | null;
  floor: string | null;
  residents: ApartmentResident[];
  _count: { packages: number };
}

export default function ApartmentManager() {
  const t = useTranslations("ApartmentManager");

  const [apartments, setApartments] = useState<ApartmentRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [number, setNumber]         = useState("");
  const [tower, setTower]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchApartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/apartments");
      if (res.ok) setApartments(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApartments(); }, [fetchApartments]);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    if (!number.trim()) { setFormError(t("numberRequired")); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/apartments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: number.trim(), tower: tower.trim() || null }),
      });

      if (res.status === 409) { setFormError(t("errorExists")); return; }
      if (!res.ok) { setFormError(t("errorGeneric")); return; }

      setNumber("");
      setTower("");
      setShowForm(false);
      flash(t("successCreated"));
      await fetchApartments();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/apartments/${id}`, { method: "DELETE" });
      if (res.status === 409) {
        alert(t("errorInUse"));
        return;
      }
      if (res.ok) {
        flash(t("successDeleted"));
        await fetchApartments();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

      {/* Header */}
      <div className="px-4 md:px-8 py-4 md:py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-slate-400" />
          <h3 className="font-bold text-slate-800 text-lg">{t("title")}</h3>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-100">
            {apartments.length}
          </span>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? t("cancel") : t("addButton")}
        </button>
      </div>

      {/* Success flash */}
      {successMsg && (
        <div className="flex items-center gap-2 px-8 py-3 bg-emerald-50 border-b border-emerald-100 text-emerald-700 text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Inline add form */}
      {showForm && (
        <form onSubmit={handleCreate} className="px-4 md:px-8 py-4 md:py-5 border-b border-slate-100 bg-indigo-50/30">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">{t("formTitle")}</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{t("numberLabel")} *</label>
              <input
                type="text"
                value={number}
                onChange={(e) => { setNumber(e.target.value); setFormError(""); }}
                placeholder={t("numberPlaceholder")}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 w-28"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{t("towerLabel")}</label>
              <input
                type="text"
                value={tower}
                onChange={(e) => setTower(e.target.value)}
                placeholder={t("towerPlaceholder")}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 w-24"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 h-[38px]"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("saveButton")}
            </button>
          </div>
          {formError && (
            <p className="mt-2 text-xs text-red-500 font-medium">{formError}</p>
          )}
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="px-4 md:px-8 py-3 md:py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("colApt")}</th>
              <th className="px-4 md:px-8 py-3 md:py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("colResident")}</th>
              <th className="px-4 md:px-8 py-3 md:py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("colPackages")}</th>
              <th className="px-8 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-8 py-10 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-200 mx-auto" />
                </td>
              </tr>
            ) : apartments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic text-sm">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              apartments.map((apt) => {
                const resident = apt.residents[0] ?? null;
                const inUse = apt._count.packages > 0 || apt.residents.length > 0;
                return (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">

                    {/* Apartment */}
                    <td className="px-4 md:px-8 py-3 md:py-4">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                        {apt.number}{apt.tower ? ` · ${apt.tower}` : ""}
                      </span>
                    </td>

                    {/* Resident */}
                    <td className="px-4 md:px-8 py-3 md:py-4">
                      {resident ? (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{resident.name ?? "—"}</p>
                            <p className="text-[10px] text-slate-400">{resident.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">{t("noResident")}</span>
                      )}
                    </td>

                    {/* Package count */}
                    <td className="px-4 md:px-8 py-3 md:py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Package className="w-3.5 h-3.5 text-slate-300" />
                        {apt._count.packages}
                      </div>
                    </td>

                    {/* Delete */}
                    <td className="px-8 py-4 text-right">
                      <button
                        onClick={() => handleDelete(apt.id)}
                        disabled={inUse || deletingId === apt.id}
                        title={inUse ? t("errorInUse") : t("deleteButton")}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {deletingId === apt.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
