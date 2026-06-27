"use client";

import { ReactNode } from "react";

export default function ResidentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pt-16" style={{ background: "#080810" }}>
      {children}
    </div>
  );
}
