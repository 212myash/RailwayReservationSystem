"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  TrainFront,
  Ticket,
  MapPin,
  Clock,
  UserRound,
  RefreshCw,
  AlertCircle,
  Search,
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

const quickLinks = [
  {
    title: "Find Trains",
    description: "Search trains between stations.",
    href: "/#plan-your-trip",
    icon: TrainFront,
  },
  {
    title: "PNR Status",
    description: "Track live reservation and seats.",
    href: "/pnr-status",
    icon: Search,
  },
  {
    title: "My Bookings",
    description: "View and manage your reservations.",
    href: "/bookings",
    icon: Ticket,
  },
  {
    title: "Stations",
    description: "Explore available railway stations.",
    href: "/stations",
    icon: MapPin,
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
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
        setIsLoggedIn(true);
        setErrorMessage(data.message || "Could not load your booking overview.");
        return;
      }

      setIsLoggedIn(true);
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
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-800 p-7 text-white sm:p-10">
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
                href="/#plan-your-trip"
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

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Your travel overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Live summary of bookings saved to your account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboardData()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {errorMessage && (
            <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p>{errorMessage}</p>
                {isLoggedIn === false && (
                  <Link
                    href={`/login?redirect=${encodeURIComponent("/dashboard")}`}
                    className="mt-2 inline-block font-bold underline underline-offset-2"
                  >
                    Login to continue
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Ticket size={23} />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">Total bookings</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {isLoading ? "…" : errorMessage ? "—" : totalBookings}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {isLoading ? "Loading booking data…" : errorMessage ? "Booking data unavailable" : `${totalBookings} saved booking${totalBookings === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Clock size={23} />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">Upcoming journeys</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {isLoading ? "…" : errorMessage ? "—" : upcomingJourneys}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {isLoading ? "Checking journey dates…" : errorMessage ? "Journey data unavailable" : "Confirmed journeys today or later"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <UserRound size={23} />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">Account status</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {isLoggedIn === null ? (isLoading ? "Checking…" : "Unknown") : isLoggedIn ? "Signed in" : "Signed out"}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {isLoggedIn === true ? "Account session verified" : isLoggedIn === false ? "Please log in to view your data" : "Could not verify your session"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-extrabold text-slate-900">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">Choose what you want to do next.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/60"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                      <Icon size={23} />
                    </div>
                    <ArrowRight size={19} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" />
                  </div>
                  <h3 className="mt-5 font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
