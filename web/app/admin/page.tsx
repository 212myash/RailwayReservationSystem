"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Armchair,
  ArrowRight,
  CheckCircle2,
  MapPin,
  PlusCircle,
  RefreshCw,
  Search,
  Ticket,
  TrainFront,
  Users,
  XCircle,
} from "lucide-react";

type AdminStats = {
  totalUsers: number;
  totalTrains: number;
  totalStations: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  recentBookings: {
    id: string;
    bookingReference: string;
    trainNumber: string;
    trainName: string;
    from: string;
    to: string;
    journeyDate: string;
    totalFare: number;
    status: string;
    passengerCount: number;
    createdAt: string;
  }[];
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();

      if (res.ok && data.success && data.stats) {
        setStats(data.stats);
      } else {
        setErrorMessage(data.message || "Failed to load dashboard statistics.");
      }
    } catch {
      setErrorMessage("Network error: Unable to contact admin stats service.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadStats]);

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
    <div className="space-y-8">
      {/* HEADER BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            System Overview
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Live database metrics and operations monitor for RailConnect reservation platform.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={isLoading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin text-blue-400" : ""} />
          Refresh Stats
        </button>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-300">
          {errorMessage}
        </div>
      )}

      {/* STATS TILES GRID */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Bookings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Bookings</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Ticket size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-white sm:text-3xl">
            {isLoading ? "..." : stats?.totalBookings ?? 0}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <span className="font-semibold text-emerald-400">
              {stats?.confirmedBookings ?? 0} confirmed
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-semibold text-red-400">
              {stats?.cancelledBookings ?? 0} cancelled
            </span>
          </div>
        </div>

        {/* Total Trains */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Active Trains</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrainFront size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-white sm:text-3xl">
            {isLoading ? "..." : stats?.totalTrains ?? 0}
          </p>
          <Link
            href="/admin/trains"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:underline"
          >
            Manage trains <ArrowRight size={11} />
          </Link>
        </div>

        {/* Total Stations */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Railway Stations</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <MapPin size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-white sm:text-3xl">
            {isLoading ? "..." : stats?.totalStations ?? 0}
          </p>
          <Link
            href="/admin/stations"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:underline"
          >
            Manage stations <ArrowRight size={11} />
          </Link>
        </div>

        {/* Registered Users */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">User Accounts</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Users size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-white sm:text-3xl">
            {isLoading ? "..." : stats?.totalUsers ?? 0}
          </p>
          <Link
            href="/admin/users"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:underline"
          >
            Manage users <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/admin/trains?action=add"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
          >
            <PlusCircle size={15} /> Add New Train
          </Link>
          <Link
            href="/admin/stations?action=add"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
          >
            <PlusCircle size={15} /> Add Station
          </Link>
          <Link
            href="/admin/seats"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
          >
            <Armchair size={15} /> View Demo Seat Matrix
          </Link>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
          >
            <Search size={15} /> Search Bookings
          </Link>
        </div>
      </div>

      {/* RECENT DATA SECTION: 2-COLUMN LAYOUT */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* RECENT BOOKINGS TABLE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Recent Reservations</h2>
            <Link
              href="/admin/bookings"
              className="text-xs font-semibold text-blue-400 hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-900" />
                ))}
              </div>
            ) : !stats?.recentBookings?.length ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No bookings recorded yet.
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400">
                    <th className="pb-2">PNR Reference</th>
                    <th className="pb-2">Train</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Fare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats.recentBookings.map((b) => (
                    <tr key={b.id} className="transition hover:bg-slate-900/50">
                      <td className="py-2.5 font-mono font-bold text-blue-400">
                        {b.bookingReference}
                      </td>
                      <td className="py-2.5 text-slate-300">
                        <span className="font-semibold">{b.trainNumber}</span>
                        <span className="block text-[10px] text-slate-500 truncate max-w-32">
                          {b.trainName}
                        </span>
                      </td>
                      <td className="py-2.5">
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
                      <td className="py-2.5 text-right font-mono font-semibold text-slate-200">
                        {money(b.totalFare)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RECENT USERS TABLE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Recent User Accounts</h2>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-blue-400 hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-900" />
                ))}
              </div>
            ) : !stats?.recentUsers?.length ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No users found.
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats.recentUsers.map((u) => (
                    <tr key={u.id} className="transition hover:bg-slate-900/50">
                      <td className="py-2.5 font-bold text-white">{u.name}</td>
                      <td className="py-2.5 text-slate-400 truncate max-w-40">{u.email}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            u.role === "admin"
                              ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {u.role === "admin" ? "Admin" : "Passenger"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-500">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
