"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { BarChart3, ArrowLeft, Package, Building, AlertCircle } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { SkeletonCard } from "@/components/ui/Skeleton";

const ease = [0.16, 1, 0.3, 1] as const;

export default function ReportsClient() {
  const t = useTranslations("Reports");
  const tCommon = useTranslations("DashboardCommon");
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) {
        setError(true);
      } else {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

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
              <BarChart3 className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t("title")}</h1>
              <p className="text-text-muted text-sm font-medium">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/conserje")}
            className="px-6 py-2.5 bg-bg-base border border-border-subtle hover:bg-bg-surface text-text-primary rounded-xl font-bold transition-all text-sm flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {tCommon("back")}
          </button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Error state */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-text-primary">{t("reportErrorTitle")}</p>
              <p className="text-xs text-text-muted mt-1">{t("reportErrorDesc")}</p>
            </div>
            <button
              onClick={() => { setError(false); fetchReports(); }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              {t("reportRetryButton")}
            </button>
          </div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard
                label={t("totalProcessed")}
                value={String(data.summary.totalProcessed)}
                icon={<Package className="w-6 h-6" aria-hidden="true" />}
                color="indigo"
              />
              <StatCard
                label={t("mostActiveTower")}
                value={String(data.summary.mostActiveTower ?? "—")}
                icon={<Building className="w-6 h-6" aria-hidden="true" />}
                color="green"
              />
            </div>
          ) : null}
        </motion.div>

        {/* Charts */}
        {!isLoading && data && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Area/Line Chart — 7-day trend */}
            <div className="lg:col-span-2 bg-bg-surface rounded-2xl border border-border-subtle p-6 transition-theme">
              <h3 className="text-base font-bold text-text-primary mb-6">{t("packagesLast7Days")}</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.05)"
                      strokeDasharray="5 5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#6B7280"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#6B7280"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.06)",
                        backgroundColor: "var(--bg-surface-2)",
                        color: "var(--text-primary)",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.3)",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#6366F1", fontWeight: "700" }}
                      cursor={{ stroke: "rgba(99,102,241,0.2)", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#6366F1"
                      strokeWidth={2.5}
                      fill="url(#trendGradient)"
                      dot={{ r: 4, fill: "#ffffff", stroke: "#6366F1", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#6366F1", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut — status distribution */}
            <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 flex flex-col transition-theme">
              <h3 className="text-base font-bold text-text-primary mb-6">{t("statusDistribution")}</h3>
              <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {data.distribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.06)",
                        backgroundColor: "var(--bg-surface-2)",
                        color: "var(--text-primary)",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.3)",
                        fontSize: "12px",
                      }}
                      itemStyle={{ fontWeight: "700" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                  <span className="text-3xl font-black text-text-primary">{data.summary.totalProcessed}</span>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">{t("chartTotal")}</span>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-2.5">
                {data.distribution.map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs font-semibold text-text-muted">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-text-primary tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
