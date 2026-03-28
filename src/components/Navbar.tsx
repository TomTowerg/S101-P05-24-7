"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackageCheck } from "lucide-react";
import { useState, useEffect } from "react";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Register", href: "/register" },
  { label: "Scan QR", href: "/scan" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ── Floating bar ──────────────────────────────────────────── */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl">
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.08)] h-12 md:h-14 px-4 md:px-6 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <PackageCheck
              className="w-[18px] h-[18px] text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"
              strokeWidth={1.75}
            />
            <span
              className="font-bold text-[#f1f0ff] text-sm tracking-wide"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              ParcelMS
            </span>
          </Link>

          {/* Center nav (desktop only) */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Language toggle */}
            <div className="hidden sm:flex items-center border border-white/10 rounded-full px-2 py-1 gap-1">
              <button className="text-xs text-white/60 hover:text-white transition-colors duration-200 px-1 cursor-pointer">
                ES
              </button>
              <span className="text-white/20 text-xs select-none">|</span>
              <button className="text-xs text-white/60 hover:text-white transition-colors duration-200 px-1 cursor-pointer">
                EN
              </button>
            </div>

            {/* Login button */}
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center border border-indigo-500/50 text-indigo-300 rounded-lg px-4 py-1.5 text-sm hover:bg-indigo-600 hover:text-white transition-all duration-200 cursor-pointer"
            >
              Login
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 text-white/60 hover:text-white transition-colors cursor-pointer"
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              <div className="relative w-5 flex flex-col justify-center gap-[5px]">
                <span
                  className={`block h-0.5 bg-current rounded-full origin-center transition-all duration-300 ${
                    isOpen ? "rotate-45 translate-y-[7px]" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${
                    isOpen ? "opacity-0 scale-x-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 bg-current rounded-full origin-center transition-all duration-300 ${
                    isOpen ? "-rotate-45 -translate-y-[7px]" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ───────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed top-20 left-4 right-4 z-40 bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-1 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/60 hover:text-white transition-colors duration-200 py-2.5 px-3 rounded-xl hover:bg-white/[0.04] cursor-pointer"
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-white/[0.06] mt-2 pt-3 flex items-center gap-3">
            <div className="flex items-center border border-white/10 rounded-full px-2 py-1 gap-1">
              <button className="text-xs text-white/60 hover:text-white transition-colors px-1 cursor-pointer">
                ES
              </button>
              <span className="text-white/20 text-xs select-none">|</span>
              <button className="text-xs text-white/60 hover:text-white transition-colors px-1 cursor-pointer">
                EN
              </button>
            </div>

            <Link
              href="/login"
              className="flex-1 text-center border border-indigo-500/50 text-indigo-300 rounded-lg px-4 py-2 text-sm hover:bg-indigo-600 hover:text-white transition-all duration-200 cursor-pointer"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
