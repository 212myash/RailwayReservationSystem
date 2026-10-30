import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, MapPin, Search, TrainFront } from "lucide-react";

const STATIONS = [
  {
    code: "NDLS",
    name: "New Delhi Railway Station",
    city: "New Delhi",
    state: "Delhi",
    zone: "Northern Railway (NR)",
    platforms: 16,
  },
  {
    code: "PNBE",
    name: "Patna Junction",
    city: "Patna",
    state: "Bihar",
    zone: "East Central Railway (ECR)",
    platforms: 10,
  },
  {
    code: "CDG",
    name: "Chandigarh Junction",
    city: "Chandigarh",
    state: "Punjab / Haryana",
    zone: "Northern Railway (NR)",
    platforms: 6,
  },
  {
    code: "ASR",
    name: "Amritsar Junction",
    city: "Amritsar",
    state: "Punjab",
    zone: "Northern Railway (NR)",
    platforms: 8,
  },
  {
    code: "BPL",
    name: "Bhopal Junction",
    city: "Bhopal",
    state: "Madhya Pradesh",
    zone: "West Central Railway (WCR)",
    platforms: 6,
  },
  {
    code: "HWH",
    name: "Howrah Junction",
    city: "Kolkata",
    state: "West Bengal",
    zone: "Eastern Railway (ER)",
    platforms: 23,
  },
  {
    code: "MMCT",
    name: "Mumbai Central",
    city: "Mumbai",
    state: "Maharashtra",
    zone: "Western Railway (WR)",
    platforms: 8,
  },
  {
    code: "KLK",
    name: "Kalka Railway Station",
    city: "Kalka",
    state: "Haryana",
    zone: "Northern Railway (NR)",
    platforms: 4,
  },
];

export default function StationsPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      {/* HEADER HERO */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
            <Building2 size={16} />
            Network Directory
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            Major Railway Stations
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
            Explore key departure and destination stations supported across the RailConnect reservation network.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#plan-your-trip"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-900 shadow-md transition hover:bg-blue-50"
            >
              <Search size={16} />
              Plan a Journey
            </Link>
            <Link
              href="/trains"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <TrainFront size={16} />
              Browse All Trains
            </Link>
          </div>
        </div>
      </section>

      {/* STATIONS GRID */}
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Supported Stations ({STATIONS.length})
            </h2>
            <p className="text-sm text-slate-500">
              Select any station to begin planning your route.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STATIONS.map((station) => (
            <article
              key={station.code}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black tracking-wider text-blue-700">
                    <MapPin size={13} />
                    {station.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {station.platforms} Platforms
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-blue-700 transition">
                  {station.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {station.city}, {station.state}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Zone: {station.zone}
                </p>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <Link
                  href={`/trains?from=${encodeURIComponent(station.city)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
                >
                  Departures from {station.city}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

