"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, ArrowLeft, Loader2, Package, Building } from "lucide-react";

export default function ReportsClient() {
  const t = useTranslations("Reports");
  const tCommon = useTranslations("DashboardCommon");
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="min-h-screen bg-bg-base pt-[68px] transition-theme">
      <div className="bg-bg-surface border-b border-border-subtle transition-theme">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-950/20">
              <BarChart3 className="w-6 h-6 text-white" />
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

      <div className="max-w-7xl mx-auto px-6 py-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          </div>
        ) : data ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-bg-surface p-6 rounded-2xl shadow-sm border border-border-subtle flex items-center gap-4 transition-theme">
                <div className="p-4 bg-indigo-500/15 rounded-xl">
                  <Package className="w-8 h-8 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{t("totalProcessed")}</p>
                  <p className="text-3xl font-black text-text-primary">{data.summary.totalProcessed}</p>
                </div>
              </div>
              <div className="bg-bg-surface p-6 rounded-2xl shadow-sm border border-border-subtle flex items-center gap-4 transition-theme">
                <div className="p-4 bg-emerald-500/15 rounded-xl">
                  <Building className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{t("mostActiveTower")}</p>
                  <p className="text-3xl font-black text-text-primary">{data.summary.mostActiveTower}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Line Chart Trend */}
              <div className="lg:col-span-2 bg-bg-surface rounded-2xl shadow-sm border border-border-subtle p-6 transition-theme">
                <h3 className="text-lg font-bold text-text-primary mb-6">{t("packagesLast7Days")}</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 8 }} />
                      <CartesianGrid stroke="rgba(156, 163, 175, 0.15)" strokeDasharray="5 5" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(156, 163, 175, 0.6)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="rgba(156, 163, 175, 0.6)" fontSize={12} tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)' }}
                        itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart Distribution */}
              <div className="bg-bg-surface rounded-2xl shadow-sm border border-border-subtle p-6 flex flex-col transition-theme">
                <h3 className="text-lg font-bold text-text-primary mb-6">{t("statusDistribution")}</h3>
                <div className="flex-1 min-h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.distribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                    <span className="text-3xl font-black text-text-primary">{data.summary.totalProcessed}</span>
                    <span className="text-[10px] font-bold text-text-muted uppercase">Total</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {data.distribution.map((item: any) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-sm font-medium text-text-muted">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
