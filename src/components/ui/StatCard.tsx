"use client";

import type { ReactNode } from "react";

type AccentColor = "indigo" | "amber" | "green" | "blue" | "red" | "gray";

const colorMap: Record<AccentColor, { text: string; bg: string; border: string }> = {
  indigo: { text: "#818CF8", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.22)" },
  amber:  { text: "#FCD34D", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.22)" },
  green:  { text: "#34D399", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.22)" },
  blue:   { text: "#60A5FA", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.22)" },
  red:    { text: "#F87171", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.22)"  },
  gray:   { text: "#9CA3AF", bg: "rgba(156,163,175,0.12)", border: "rgba(156,163,175,0.22)" },
};

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  color?: AccentColor;
  className?: string;
}

export default function StatCard({
  value,
  label,
  icon,
  color = "indigo",
  className = "",
}: StatCardProps) {
  const c = colorMap[color];
  return (
    <div
      className={`rounded-xl p-5 flex items-center justify-between gap-4 ${className}`}
      style={{ background: "#0E0E1C", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="space-y-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] truncate" style={{ color: "rgba(255,255,255,0.40)" }}>
          {label}
        </p>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      </div>
      {icon && (
        <div
          className="p-3 rounded-xl shrink-0"
          style={{ color: c.text, background: c.bg, border: `1px solid ${c.border}` }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
    </div>
  );
}
