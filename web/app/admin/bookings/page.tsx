"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

type BookingItem = {
  id: string;
  bookingReference: string;
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  journeyDate: string;
  coach: string;
  seats: string[];
  passengerCount: number;
  passengers: {
    name: string;
    age: number;
    gender: string;
  }[];
  totalFare: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
    hasMore: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  const loadBookings = useCallback(
    async (targetStatus: string, targetSearch: string, targetPage: number) => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const queryParams = new URLSearchParams({
          page: targetPage.toString(),
          limit: "15",
          status: targetStatus,
          ...(targetSearch ? { search: targetSearch } : {}),
        });

        const res = await fetch(`/api/admin/bookings?${queryParams.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setBookings(data.bookings || []);
          if (data.pagination) setPagination(data.pagination);
        } else {
          setErrorMessage(data.message || "Failed to load bookings.");
        }
      } catch {
        setErrorMessage("Network error connecting to booking service.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadBookings(statusFilter, searchTerm, page);
    }, 0);
    return () => clearTimeout(timer);
  }, [statusFilter, searchTerm, page, loadBookings]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    void loadBookings(statusFilter, searchTerm, 1);
  }

  function handleStatusChange(newStatus: string) {
    setStatusFilter(newStatus);
    setPage(1);
  }

  const money = (num: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Booking Records</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Inspect all system reservations across the database with live passenger manifests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadBookings(statusFilter, searchTerm, page)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-300">
          {errorMessage}
        </div>
      )}

      {/* CONTROLS BAR */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 p-1 text-xs">
          {["all", "confirmed", "cancelled"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => handleStatusChange(st)}
              className={`rounded-lg px-3 py-1.5 font-bold capitalize transition ${
                statusFilter === st
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-md gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by PNR, train, route, or passenger..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* BOOKINGS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-900" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No booking records match your query.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold text-slate-400">
                  <th className="px-4 py-3">PNR Reference</th>
                  <th className="px-4 py-3">Train & Route</th>
                  <th className="px-4 py-3">Journey Date</th>
                  <th className="px-4 py-3">Passengers</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Total Fare</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bookings.map((b) => (
                  <tr key={b.id} className="transition hover:bg-slate-900/40">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-black text-blue-400">
                        {b.bookingReference}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Booked: {formatDate(b.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-white">{b.trainNumber}</span>
                      <span className="block text-slate-400 text-[11px]">
                        {b.from} → {b.to}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-300">
                      {b.journeyDate}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-200">
                        {b.passengerCount} passenger{b.passengerCount > 1 ? "s" : ""}
                      </span>
                      <span className="block text-[10px] text-slate-500 truncate max-w-40">
                        {b.passengers.map((p) => p.name).join(", ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {b.coach}: {b.seats.join(", ")}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-200">
                      {money(b.totalFare)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          b.status === "confirmed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {b.status === "confirmed" ? (
                          <CheckCircle2 size={11} />
                        ) : (
                          <XCircle size={11} />
                        )}
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/pnr-status?pnr=${encodeURIComponent(b.bookingReference)}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-blue-400 hover:bg-slate-800"
                      >
                        Inspect
                        <ExternalLink size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* PAGINATION */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
          <p className="text-slate-400">
            Page <span className="font-bold text-white">{page}</span> of{" "}
            <span className="font-bold text-white">{pagination.totalPages}</span>{" "}
            ({pagination.total} total bookings)
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
