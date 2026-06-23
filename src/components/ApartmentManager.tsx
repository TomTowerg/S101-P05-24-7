"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Building2, Plus, Trash2, User, Package, Loader2, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchApartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/apartments");
      if (res.ok) {
        const data: ApartmentRow[] = await res.json();
        setApartments(data.sort((a, b) => parseInt(a.number) - parseInt(b.number)));
      }
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
        toast.error(t("errorInUse"));
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
    <div className="bg-bg-surface rounded-2xl shadow-sm border border-border-subtle overflow-hidden transition-theme">
 
      {/* Header */}
      <div className="px-4 md:px-8 py-4 md:py-6 border-b border-border-subtle bg-bg-base/30 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-text-muted/60" />
          <h3 className="font-bold text-text-primary text-lg">{t("title")}</h3>
          <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-500 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-500/25">
            {apartments.length}
          </span>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? t("cancel") : t("addButton")}
        </button>
      </div>

      {/* Success flash */}
      {successMsg && (
        <div className="flex items-center gap-2 px-8 py-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-500 text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Inline add form */}
      {showForm && (
        <form onSubmit={handleCreate} className="px-4 md:px-8 py-4 md:py-5 border-b border-border-subtle bg-indigo-500/5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-3">{t("formTitle")}</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">{t("numberLabel")} *</label>
              <input
                type="text"
                value={number}
                onChange={(e) => { setNumber(e.target.value); setFormError(""); }}
                placeholder={t("numberPlaceholder")}
                className="bg-bg-base border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-indigo-500 w-28"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">{t("towerLabel")}</label>
              <input
                type="text"
                value={tower}
                onChange={(e) => setTower(e.target.value)}
                placeholder={t("towerPlaceholder")}
                className="bg-bg-base border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-indigo-500 w-24"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 h-[38px] cursor-pointer"
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
            <tr className="bg-bg-base/60 border-b border-border-subtle">
              <th className="px-4 md:px-8 py-3 md:py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("colApt")}</th>
              <th className="px-4 md:px-8 py-3 md:py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("colResident")}</th>
              <th className="px-4 md:px-8 py-3 md:py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">{t("colPackages")}</th>
              <th className="px-8 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-8 py-10 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-text-muted/30 mx-auto" />
                </td>
              </tr>
            ) : apartments.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8">
                  <EmptyState
                    icon={Building2}
                    title={t("empty")}
                  />
                </td>
              </tr>
            ) : (
              apartments.map((apt) => {
                const inUse = apt._count.packages > 0 || apt.residents.length > 0;
                return (
                  <tr key={apt.id} className="hover:bg-bg-base/50 transition-colors">

                    {/* Apartment */}
                    <td className="px-4 md:px-8 py-3 md:py-4">
                      <span className="px-2.5 py-1 bg-bg-base rounded-lg text-xs font-bold text-text-primary border border-border-subtle">
                        {apt.number}{apt.tower ? ` · ${apt.tower}` : ""}
                      </span>
                    </td>

                    {/* Residents */}
                    <td className="px-4 md:px-8 py-3 md:py-4">
                      {apt.residents.length === 0 ? (
                        <span className="text-xs text-text-muted italic">{t("noResident")}</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {apt.residents.map((r) => (
                            <div key={r.id} className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-text-primary">{r.name ?? "—"}</p>
                                <p className="text-[10px] text-text-muted">{r.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
 
                    {/* Package count */}
                    <td className="px-4 md:px-8 py-3 md:py-4">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Package className="w-3.5 h-3.5 text-text-muted/40" />
                        {apt._count.packages}
                      </div>
                    </td>
 
                    {/* Delete */}
                    <td className="px-8 py-4 text-right">
                      {confirmDeleteId === apt.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] text-text-muted font-medium">{t("confirmDelete")}</span>
                          <button
                            onClick={() => { handleDelete(apt.id); setConfirmDeleteId(null); }}
                            disabled={deletingId === apt.id}
                            className="px-2 py-1 rounded-lg bg-red-500/15 text-red-400 text-[10px] font-bold hover:bg-red-500/25 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === apt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : t("confirmYes")}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-bg-base text-text-muted text-[10px] font-bold hover:bg-bg-surface-2 transition-colors cursor-pointer"
                          >
                            {t("confirmNo")}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => !inUse && setConfirmDeleteId(apt.id)}
                          disabled={inUse || deletingId === apt.id}
                          title={inUse ? t("errorInUse") : t("deleteButton")}
                          className="p-1.5 rounded-lg text-text-muted/40 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {deletingId === apt.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
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
