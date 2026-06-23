"use client";

import type { ReactNode } from "react";

type AccentColor = "indigo" | "amber" | "green" | "blue" | "red" | "gray";

const colorMap: Record<AccentColor, string> = {
  indigo: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  amber:  "text-amber-400  bg-amber-400/10  border-amber-400/20",
  green:  "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  blue:   "text-blue-400   bg-blue-400/10   border-blue-400/20",
  red:    "text-red-400    bg-red-400/10    border-red-400/20",
  gray:   "text-gray-400   bg-gray-400/10   border-gray-400/20",
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
  return (
    <div
      className={`bg-bg-surface border border-border-subtle rounded-xl p-5 flex items-center justify-between gap-4 transition-theme ${className}`}
    >
      <div className="space-y-1 min-w-0">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] truncate">
          {label}
        </p>
        <p className="text-3xl font-bold text-text-primary tracking-tight">{value}</p>
      </div>
      {icon && (
        <div className={`p-3 rounded-xl border shrink-0 ${colorMap[color]}`} aria-hidden="true">
          {icon}
        </div>
      )}
    </div>
  );
}
