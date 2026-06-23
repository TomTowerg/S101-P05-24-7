"use client";

export type PackageStatus = "PENDING" | "NOTIFIED" | "DELIVERED";
export type ClaimStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type BadgeStatus = PackageStatus | ClaimStatus;

interface Variant {
  className: string;
  defaultLabel: string;
}

const VARIANTS: Record<BadgeStatus, Variant> = {
  // Package statuses
  PENDING: {
    className: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    defaultLabel: "Pendiente",
  },
  NOTIFIED: {
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    defaultLabel: "Notificado",
  },
  DELIVERED: {
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    defaultLabel: "Entregado",
  },
  // Claim statuses
  OPEN: {
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    defaultLabel: "Abierto",
  },
  IN_PROGRESS: {
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    defaultLabel: "En proceso",
  },
  RESOLVED: {
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    defaultLabel: "Resuelto",
  },
};

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  const variant = VARIANTS[status] ?? VARIANTS.PENDING;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${variant.className} ${className}`}
    >
      {label ?? variant.defaultLabel}
    </span>
  );
}
