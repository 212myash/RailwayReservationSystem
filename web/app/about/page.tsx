import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Globe2,
  Layers,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  TrainFront,
} from "lucide-react";

export const metadata = {
  title: "About RailConnect | System Architecture & Overview",
  description:
    "Learn about RailConnect's architecture, data modeling, C++ DSA algorithms, and full-stack implementation.",
};

const techPillars = [
  {
    icon: Globe2,
    title: "Next.js 16 & React 19",
    description:
      "Modern server and client architecture featuring App Router, streaming layouts, and Turbopack for ultra-fast performance.",
  },
  {
    icon: Database,
    title: "MongoDB Atlas Cloud",
    description:
      "Scalable document schemas indexing 9,063 railway stations, 5,200 active passenger trains, and multi-class coach inventories.",
  },
  {
    icon: Cpu,
    title: "C++ DSA Core Engine",
    description:
      "High-efficiency booking history, ticket hashing, and search algorithms implemented in modular C++ in the dsa/ subsystem.",
  },
  {
    icon: ShieldCheck,
    title: "Edge Role-Based Security",
    description:
      "Next.js Edge middleware coupled with server-side jose HS256 JWT tokens to strictly enforce passenger vs admin permissions.",
  },
];

const milestones = [
  "Comprehensive database seeded with 9,063 verified Indian railway stations.",
  "Over 5,200 India-wide passenger trains mapped with stops and multi-class coaches.",
  "Dynamic coach configuration generating authentic layouts for SL, 3A, 2A, 1A, CC, and 2S.",
  "Deterministic berth calculation and temporary seat reservation locking.",
  "Cryptographically signed PNR status tracker with passenger privacy safeguards.",
  "Vector-rendered PDF E-Ticket generation with live QR codes and journey details.",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      {/* HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 px-5 py-20 text-white sm:px-8 sm:py-28 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full border border-white/10" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-200 backdrop-blur-xs">
            <TrainFront size={16} />
            Academic & Demonstration Project
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
            About Rail<span className="text-blue-400">Connect</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-blue-100 sm:text-lg">
            A full-stack, enterprise-grade railway reservation simulation platform.
            Engineered to demonstrate modern web architecture, distributed database design, and algorithmic seat management.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/trains"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-950 shadow-lg transition hover:bg-blue-50"
            >
              Explore Train Network
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/stations"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              <MapPin size={17} />
              View 9,000+ Stations
            </Link>
          </div>
        </div>
      </section>

      {/* MISSION & ARCHITECTURE */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              System Overview
            </span>
            <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl dark:text-white">
              Bridging Modern Web & High-Performance DSA
            </h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              RailConnect combines high-productivity TypeScript full-stack development with low-level
              algorithmic rigor. It models the real-world complexity of the Indian Railways booking ecosystem—including
              multi-leg station hierarchies, multi-class coaches, dynamic pricing formulas, and concurrency handling.
            </p>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              The project demonstrates how modern web applications can seamlessly maintain high data integrity
              across thousands of routes while delivering instant responses and a smooth, accessible interface.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white">
              <Layers className="text-blue-600 dark:text-blue-400" size={22} />
              Core Technical Capabilities
            </h3>
            <ul className="mt-6 space-y-4">
              {milestones.map((m) => (
                <li key={m} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TECH STACK GRID */}
      <section className="border-t border-slate-200 bg-white py-16 transition-colors dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Technology Architecture
            </span>
            <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl dark:text-white">
              Built on Modern Industry Standards
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {techPillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-5 font-bold text-slate-900 dark:text-white">{p.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ACADEMIC DISCLAIMER BANNER */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-start gap-4">
            <ShieldAlert size={28} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-amber-950 dark:text-amber-200">
                Educational Demonstration Notice
              </h3>
              <p className="mt-2 text-sm leading-6 text-amber-900/90 dark:text-amber-300/80">
                RailConnect is an academic prototype developed for software engineering and algorithmic analysis.
                All station names, train schedules, and seat layouts reflect imported open datasets and simulated configurations.
                This application does not process live monetary transactions, issue official IRCTC tickets, or interact with official Indian Railways servers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
