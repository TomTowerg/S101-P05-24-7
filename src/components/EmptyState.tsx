import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`bg-bg-surface/30 rounded-2xl border border-border-subtle p-12 md:p-16 text-center space-y-6 transition-theme shadow-lg ${className}`}
    >
      <div className="inline-flex p-5 rounded-[2rem] bg-bg-surface/10 border border-border-subtle shadow-inner mb-2 text-text-primary/20">
        <Icon className="w-10 h-10 animate-float" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-text-primary tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-text-muted max-w-sm mx-auto text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="pt-2">
          <button
            onClick={action.onClick}
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-md hover:shadow-indigo-950/20 cursor-pointer"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}
