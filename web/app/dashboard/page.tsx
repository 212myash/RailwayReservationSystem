"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Clock,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Ticket,
  TrainFront,
  UserRound,
} from "lucide-react";

type Booking = {
  id: string;
  bookingReference: string;
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  journeyDate: string;
  passengerCount: number;
  totalFare: number;
  status: string;
};

type BookingApiResponse = {
  success?: boolean;
  message?: string;
  bookings?: Booking[];
};

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

const quickLinks = [
  {
    title: "Find Trains",
    description: "Search trains across 9,000+ Indian stations.",
    href: "/trains",
    icon: TrainFront,
  },
  {
    title: "PNR Status",
    description: "Track live reservation status and confirmed seats.",
    href: "/pnr-status",
    icon: Search,
  },
  {
    title: "My Bookings",
    description: "View and manage all your reservations and tickets.",
    href: "/bookings",
    icon: Ticket,
  },
  {
    title: "Stations",
    description: "Explore available railway stations and junctions.",
    href: "/stations",
    icon: MapPin,
  },
  {
    title: "Notifications",
    description: "View booking alerts and security updates.",
    href: "/notifications",
    icon: Bell,
  },
];

function getTodayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [unauthorizedAdmin, setUnauthorizedAdmin] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("unauthorized") === "admin") {
        setUnauthorizedAdmin(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 1. Fetch user session
      const authRes = await fetch("/api/auth/me", { cache: "no-store" });
      const authData = await authRes.json();

      if (authRes.ok && authData.success && authData.user) {
        setCurrentUser(authData.user);
        setIsLoggedIn(true);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }

      // 2. Fetch bookings
      const response = await fetch("/api/bookings", {
        method: "GET",
        cache: "no-store",
      });
      const data: BookingApiResponse = await response.json();

      if (response.status === 401) {
        setIsLoggedIn(false);
        setBookings([]);
        setErrorMessage("Please log in to see your booking overview.");
        return;
      }

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Could not load your booking overview.");
        return;
      }

      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (error) {
      console.error("Unable to load dashboard bookings:", error);
      setIsLoggedIn(null);
      setErrorMessage("Unable to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboardData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboardData]);

  const today = getTodayInIndia();
  const totalBookings = bookings.length;
  const upcomingJourneys = bookings.filter((booking) => {
    const journeyDate = String(booking.journeyDate || "").slice(0, 10);
    return journeyDate >= today && booking.status?.toLowerCase() === "confirmed";
  }).length;

  return (
    <main className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        {/* UNAUTHORIZED ADMIN BANNER */}
        {unauthorizedAdmin && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertCircle size={22} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">Administrative Access Restricted</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                The administrative section you attempted to access requires verified Administrator privileges.
                Your current account is signed in with standard passenger permissions.
              </p>
            </div>
          </div>
        )}

        {/* ADMIN ACCOUNT PROMINENT BANNER (When an admin visits dashboard) */}
        {currentUser?.role === "admin" && (
          <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 p-6 text-white shadow-xl sm:flex-row sm:items-center dark:border-indigo-800">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-300 ring-1 ring-white/20">
                <Shield size={26} />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-2.5 py-0.5 text-xs font-bold text-indigo-200">
                  Administrator Account
                </div>
                <h2 className="mt-1 text-lg font-extrabold text-white">
                  RailConnect Admin Console Ready
                </h2>
                <p className="text-xs text-indigo-200">
                  Signed in as {currentUser.email}. Manage India-wide trains, coaches, stations, schedules, and user roles.
                </p>
              </div>
            </div>
            <Link
              href="/admin"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
            >
              Open Admin Console
              <ArrowRight size={17} />
            </Link>
          </div>
        )}

        {/* HERO SECTION */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-800 p-7 text-white shadow-xl sm:p-10 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                Passenger dashboard
              </p>
              <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                Welcome to RailConnect
              </h1>
              <p className="mt-4 max-w-xl leading-7 text-blue-100">
                Your railway journey starts here. Search trains, explore
                stations and manage your reservations from one place.
              </p>
              <Link
                href="/trains"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-blue-900 transition hover:bg-blue-50"
              >
                Find a train
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="hidden rounded-3xl border border-white/15 bg-white/10 p-7 text-white sm:block">
              <TrainFront size={76} strokeWidth={1.3} />
            </div>
          </div>
        </section>

        {/* TRAVEL OVERVIEW */}
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Your travel overview
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Live summary of bookings saved to your account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboardData()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {errorMessage && (
            <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p>{errorMessage}</p>
                {isLoggedIn === false && (
                  <Link
                    href={`/login?redirect=${encodeURIComponent("/dashboard")}`}
                    className="mt-2 inline-block font-bold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300"
                  >
                    Login to continue
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                <Ticket size={23} />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">Total bookings</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {isLoading ? "…" : errorMessage ? "—" : totalBookings}
              </p>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                {isLoading ? "Loading booking data…" : errorMessage ? "Booking data unavailable" : `${totalBookings} saved booking${totalBookings === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                <Clock size={23} />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">Upcoming journeys</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {isLoading ? "…" : errorMessage ? "—" : upcomingJourneys}
              </p>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                {isLoading ? "Checking journey dates…" : errorMessage ? "Journey data unavailable" : "Confirmed journeys today or later"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <UserRound size={23} />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">Account status</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {isLoggedIn === null ? (isLoading ? "Checking…" : "Unknown") : isLoggedIn ? (currentUser?.role === "admin" ? "Admin" : "Signed in") : "Signed out"}
              </p>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                {isLoggedIn === true ? `Active: ${currentUser?.email || "verified"}` : isLoggedIn === false ? "Please log in to view your data" : "Could not verify your session"}
              </p>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-10">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose what you want to do next.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                      <Icon size={23} />
                    </div>
                    <ArrowRight size={19} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700 dark:text-slate-500 dark:group-hover:text-blue-400" />
                  </div>
                  <h3 className="mt-5 font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
