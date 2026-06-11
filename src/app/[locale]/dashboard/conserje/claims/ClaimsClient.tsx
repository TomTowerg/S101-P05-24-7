"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function ClaimsClient() {
  const t = useTranslations("Claims");
  const tCommon = useTranslations("DashboardCommon");
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg-base pt-[68px] transition-theme">
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
          <button
            onClick={() => router.push("/dashboard/conserje")}
            className="px-6 py-2.5 bg-bg-base border border-border-subtle hover:bg-bg-surface text-text-primary rounded-xl font-bold transition-all text-sm flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4"/>
            {tCommon("back")}
          </button>
        </div>
      </div>

      {/* Main Content Area showing EmptyState */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-10">
        <EmptyState
          icon={AlertCircle}
          title={t("emptyTitle")}
          description={t("emptyDesc")}
        />
      </div>
    </div>
  );
}
