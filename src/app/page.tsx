"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  PackageCheck,
  QrCode,
  Bell,
  Clock,
  Cloud,
  LayoutDashboard,
} from "lucide-react";

// ── Spotlight card ────────────────────────────────────────────────────────────

interface BentoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  className?: string;
}

function SpotlightCard({
  title,
  description,
  icon,
  badge,
  className = "",
}: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 0, y: 0, visible: false });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
  }

  function handleMouseLeave() {
    setSpot((s) => ({ ...s, visible: false }));
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.06] hover:scale-[1.02] transition-all duration-300 cursor-pointer ${className}`}
    >
      {/* Spotlight overlay — inline style intentional (dynamic gradient) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: spot.visible ? 1 : 0,
          transition: "opacity 0.2s ease",
          background: `radial-gradient(200px at ${spot.x}px ${spot.y}px, rgba(99,102,241,0.08), transparent)`,
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {badge && (
          <span className="self-start mb-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {badge}
          </span>
        )}
        <div className="text-indigo-400 mb-3">{icon}</div>
        <h3
          className="text-sm font-semibold text-[#f1f0ff] mb-1.5"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {title}
        </h3>
        <p className="text-xs text-[#6b6a8a] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ── Bento card data ───────────────────────────────────────────────────────────

const BENTO_CARDS: (BentoCardProps & { gridClass: string })[] = [
  {
    title: "Package Registration",
    description:
      "Log every incoming parcel with apartment number, carrier, and a unique tracking code. Concierges register deliveries in seconds — residents are notified automatically.",
    icon: <PackageCheck className="w-6 h-6" strokeWidth={1.5} />,
    badge: "Core feature",
    gridClass: "md:col-span-2 md:row-span-2",
  },
  {
    title: "QR Scanning",
    description:
      "Generate a unique QR code per parcel. Residents scan it on pickup for frictionless, verified retrieval.",
    icon: <QrCode className="w-5 h-5" strokeWidth={1.5} />,
    gridClass: "md:col-span-2",
  },
  {
    title: "Push Notifications",
    description:
      "Real-time Web Push alerts to residents when a parcel arrives or is ready for pickup.",
    icon: <Bell className="w-5 h-5" strokeWidth={1.5} />,
    gridClass: "md:col-span-1",
  },
  {
    title: "Delivery History",
    description:
      "Full audit trail — reception date, pickup date, and who collected each parcel.",
    icon: <Clock className="w-5 h-5" strokeWidth={1.5} />,
    gridClass: "md:col-span-1",
  },
  {
    title: "Cloud Deploy",
    description:
      "Frontend on Vercel, database on Railway. CI/CD pipeline ready for Sprint 5.",
    icon: <Cloud className="w-5 h-5" strokeWidth={1.5} />,
    badge: "Sprint 5",
    gridClass: "md:col-span-2",
  },
  {
    title: "Concierge Dashboard",
    description:
      "Overview of pending parcels, delivered items, and resident management — all in one panel.",
    icon: <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} />,
    gridClass: "md:col-span-2",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-16 pb-28 min-h-[88vh]">
        {/* Radial glow background */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="w-[700px] h-[500px] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(99,102,241,0.10) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Eyebrow pill */}
        <div className="relative inline-flex items-center gap-2 border border-indigo-500/20 bg-indigo-500/5 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-300 tracking-widest uppercase">
            Sprint 1 — Preview
          </span>
        </div>

        {/* Headline */}
        <h1
          className="relative text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#f1f0ff] mb-6 leading-[1.08]"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Building{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Package
          </span>
          <br />
          Management
        </h1>

        {/* Subtitle */}
        <p className="relative text-xl text-white/50 max-w-md mb-10 leading-relaxed">
          Streamline deliveries for every resident.
        </p>

        {/* CTA buttons */}
        <div className="relative flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:bg-indigo-500 transition-all duration-200 cursor-pointer"
          >
            Get Started
          </Link>
          <button className="inline-flex items-center justify-center rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/[0.05] hover:text-white transition-all duration-200 cursor-pointer">
            View Demo
          </button>
        </div>
      </section>

      {/* ── Bento Grid ─────────────────────────────────────────────── */}
      <section className="px-4 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {BENTO_CARDS.map((card) => (
            <SpotlightCard
              key={card.title}
              title={card.title}
              description={card.description}
              icon={card.icon}
              badge={card.badge}
              className={card.gridClass}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
