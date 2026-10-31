"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  Home,
  Info,
  LifeBuoy,
  MapPin,
  Shield,
  Ticket,
  TrainFront,
  Search,
} from "lucide-react";

const exploreLinks = [
  { label: "Home", href: "/", Icon: Home },
  { label: "Find Trains", href: "/trains", Icon: TrainFront },
  { label: "Stations Directory", href: "/stations", Icon: MapPin },
  { label: "PNR Status", href: "/pnr-status", Icon: Search },
  { label: "My Bookings", href: "/bookings", Icon: Ticket },
  { label: "Notifications", href: "/notifications", Icon: Bell },
];

const companyLinks = [
  { label: "About RailConnect", href: "/about", Icon: Info },
  { label: "Contact & Support", href: "/contact", Icon: LifeBuoy },
  { label: "Admin Console", href: "/admin", Icon: Shield },
];

const projectFeatures = [
  "India-wide station directory (9,000+ stations)",
  "Dynamic multi-class coach configurations",
  "Interactive seat selection & live lock API",
  "Cryptographic PNR verification & status tracker",
  "Downloadable PDF E-Tickets with QR codes",
  "High-performance C++ DSA engine integration",
];

export default function Footer() {
  const pathname = usePathname();

  // Completely isolate the Admin Console from public consumer footer
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

      <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 sm:px-8 sm:pt-16">
        <div className="grid gap-10 border-b border-slate-100 pb-12 md:grid-cols-[1.2fr_0.8fr_0.8fr_1.2fr] md:gap-10 dark:border-slate-800">
          {/* BRAND */}
          <div>
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-700/20 transition duration-300 group-hover:-translate-y-1 group-hover:rotate-[-4deg]">
                <ArrowUpRight size={24} strokeWidth={2.5} />
              </span>
              <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
                Rail<span className="text-blue-700 dark:text-blue-400">Connect</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
              Modern railway reservation and route intelligence platform powered by Next.js, MongoDB Atlas, and C++ Data Structures & Algorithms.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
              <TrainFront size={14} />
              Railway Reservation System Demo
            </div>
          </div>

          {/* EXPLORE */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Explore
            </h2>

            <ul className="mt-4 space-y-3">
              {exploreLinks.map(({ label, href, Icon }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2.5 text-sm text-slate-500 transition hover:translate-x-1 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    <Icon
                      size={16}
                      className="text-slate-400 transition group-hover:text-blue-700 dark:text-slate-500 dark:group-hover:text-blue-400"
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SYSTEM & ABOUT */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Platform
            </h2>

            <ul className="mt-4 space-y-3">
              {companyLinks.map(({ label, href, Icon }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2.5 text-sm text-slate-500 transition hover:translate-x-1 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    <Icon
                      size={16}
                      className="text-slate-400 transition group-hover:text-blue-700 dark:text-slate-500 dark:group-hover:text-blue-400"
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* PROJECT FEATURES */}
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              System Capabilities
            </h2>

            <ul className="mt-4 space-y-2.5">
              {projectFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between dark:text-slate-500">
          <p>
            © {new Date().getFullYear()} RailConnect. Educational demonstration project.
          </p>

          <p className="max-w-xl text-[11px] leading-relaxed text-slate-400 sm:text-right dark:text-slate-500">
            Simulated Indian railway system for academic evaluation. Not affiliated with Indian Railways, IRCTC, or CRIS.
          </p>
        </div>
      </div>
    </footer>
  );
}
