"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { 
  LayoutDashboard, 
  PackageSearch, 
  BarChart3, 
  AlertCircle,
  LogOut,
  Package
} from "lucide-react";
import { ReactNode } from "react";

export default function ConciergeLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const t = useTranslations("Concierge");
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/conserje", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/conserje/packages", icon: PackageSearch, label: "Packages" },
    { href: "/dashboard/conserje/reports", icon: BarChart3, label: "Reports" },
    { href: "/dashboard/conserje/claims", icon: AlertCircle, label: "Claims" }
  ];

  const isActive = (path: string) => {
    // pathname includes the locale, so we need to check if it ends with or matches
    if (path === "/dashboard/conserje") {
      return pathname.endsWith("/dashboard/conserje");
    }
    return pathname.includes(path);
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col md:flex-row pt-[68px] transition-theme">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-bg-surface border-r border-border-subtle flex flex-col hidden md:flex h-[calc(100vh-68px)] sticky top-[68px] transition-theme">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md shadow-indigo-200">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary text-lg leading-none tracking-tight">Loombox</h2>
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600">Concierge</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  active
                    ? "bg-indigo-500/15 text-indigo-600"
                    : "text-text-muted hover:bg-bg-base hover:text-text-primary"
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "text-indigo-600" : "text-text-muted/65"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border-subtle">
          <div className="mb-4 px-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/25">
              {session?.user?.name?.charAt(0) || "C"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-text-primary truncate">{session?.user?.name || "Concierge"}</p>
              <p className="text-[10px] text-text-muted truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t("signOut").toUpperCase()}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden min-h-[calc(100vh-68px)]">
        {children}
      </main>

      {/* Mobile Navigation (Bottom bar) */}
      <nav aria-label="Navegación móvil" className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border-subtle flex justify-around p-2 z-50 transition-theme">
         {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={`flex flex-col items-center p-2 rounded-lg ${
                  active ? "text-indigo-600" : "text-text-muted"
                }`}
              >
                <item.icon className="w-5 h-5 mb-1" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase">{item.label}</span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
