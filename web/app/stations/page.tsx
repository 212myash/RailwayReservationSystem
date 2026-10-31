"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  TrainFront,
  X,
} from "lucide-react";

type Station = {
  code: string;
  name: string;
  city: string;
  state?: string;
  zone?: string;
  platforms?: number;
};

export default function StationsPage() {
  const [query, setQuery] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStations = useCallback(async (searchQuery: string, pageNum: number) => {
    setIsLoading(true);
    try {
      const url = `/api/stations?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=24`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setStations(data.stations || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch stations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStations(query, 1);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, fetchStations]);

  // Page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchStations(query, newPage);
      window.scrollTo({ top: 380, behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
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
            All-India Railway Network Directory
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            Railway Stations Directory
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
            Search across 9,000+ Indian railway stations. Look up telegraphic station codes, cities, states, railway zones, and discover routes across the country.
          </p>

          {/* SEARCH BOX IN HERO */}
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by code (NDLS), station name, or city..."
                className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-12 text-base font-semibold text-slate-900 shadow-xl placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-300"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-blue-200">
              Tip: Enter telegraphic codes like <span className="font-mono font-bold text-white">NDLS</span>, <span className="font-mono font-bold text-white">HWH</span>, <span className="font-mono font-bold text-white">MMCT</span>, <span className="font-mono font-bold text-white">BPL</span>, <span className="font-mono font-bold text-white">MAS</span> or cities.
            </p>
          </div>
        </div>
      </section>

      {/* STATIONS GRID */}
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {query ? `Search Results (${total})` : `All Stations (${total.toLocaleString()})`}
            </h2>
            <p className="text-sm text-slate-500">
              {query
                ? `Showing matching stations for "${query}"`
                : "Browse the complete indexed railway station database"}
            </p>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 size={36} className="animate-spin text-blue-600" />
            <p className="mt-4 text-sm font-semibold">Searching stations...</p>
          </div>
        ) : stations.length > 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stations.map((station) => (
                <article
                  key={station.code}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 font-mono text-sm font-black tracking-wider text-blue-800">
                        <MapPin size={13} className="text-blue-600" />
                        {station.code}
                      </span>
                      {station.platforms ? (
                        <span className="text-xs font-semibold text-slate-400">
                          {station.platforms} Platforms
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3.5 text-base font-bold text-slate-900 transition group-hover:text-blue-700">
                      {station.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {station.city}
                      {station.state ? `, ${station.state}` : ""}
                    </p>

                    {station.zone ? (
                      <p className="mt-2 text-xs text-slate-400">
                        Zone: {station.zone}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <Link
                      href={`/trains?from=${encodeURIComponent(station.code)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
                    >
                      <TrainFront size={14} />
                      Find Departures from {station.code}
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* BOTTOM PAGINATION */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || isLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="text-sm font-bold text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || isLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <Building2 size={40} className="mx-auto text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No stations found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              No railway stations found matching &quot;{query}&quot;. Try a different spelling or telegraphic code.
            </p>
            <button
              onClick={() => setQuery("")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Clear Search
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
