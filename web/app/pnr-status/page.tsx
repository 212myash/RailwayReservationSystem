"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Search,
  Ticket,
  TrainFront,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

type Passenger = {
  name: string;
  age: number;
  gender: string;
};

type TrackedBooking = {
  bookingReference: string;
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  journeyDate: string;
  passengerCount: number;
  coach: string;
  seats: string[];
  totalFare: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
  passengers: Passenger[];
};

function PnrStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPnr = searchParams.get("pnr") || searchParams.get("reference") || "";

  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [booking, setBooking] = useState<TrackedBooking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  async function handleTrack(targetPnr: string) {
    const trimmed = targetPnr.trim();

    if (!trimmed) {
      setErrorMessage("Please enter a booking reference or PNR number.");
      setBooking(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setIsLoggedOut(false);
    setBooking(null);

    try {
      const response = await fetch(
        `/api/pnr-status?pnr=${encodeURIComponent(trimmed)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setIsLoggedOut(true);
        setErrorMessage("Please log in to track your booking status.");
        return;
      }

      if (response.status === 403) {
        setErrorMessage(
          data.message ||
            "You do not have permission to view this booking. Please ensure you are signed in to the account that made the reservation."
        );
        return;
      }

      if (!response.ok || !data.success || !data.booking) {
        setErrorMessage(
          data.message || "Booking reference not found. Please verify your reference number."
        );
        return;
      }

      setBooking(data.booking);
    } catch (error) {
      console.error("PNR lookup failure:", error);
      setErrorMessage("Unable to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pnrInput.trim()) {
      router.replace(`/pnr-status?pnr=${encodeURIComponent(pnrInput.trim())}`, { scroll: false });
      void handleTrack(pnrInput);
    }
  }

  useEffect(() => {
    if (!initialPnr) return;

    const timer = setTimeout(() => {
      void handleTrack(initialPnr);
    }, 0);

    return () => clearTimeout(timer);
  }, [initialPnr]);

  const money = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  function formatDate(dateStr: string) {
    const parsed = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return dateStr;

    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(isoStr: string) {
    const parsed = new Date(isoStr);
    if (Number.isNaN(parsed.getTime())) return isoStr;

    return parsed.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      {/* HEADER HERO */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
            <Ticket size={16} />
            Reservation Verification
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            PNR / Booking Status
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
            Check the real-time reservation status, coach and seat allocation, and passenger breakdown of your RailConnect booking.
          </p>
        </div>
      </section>

      {/* TRACKING INPUT SECTION */}
      <section className="mx-auto -mt-6 max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
          <form onSubmit={onSubmit}>
            <label
              htmlFor="pnr-input"
              className="block text-sm font-bold text-slate-800"
            >
              Enter Booking Reference or PNR
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Your unique reservation code found on your ticket confirmation (e.g. RC...)
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Ticket size={18} />
                </div>
                <input
                  id="pnr-input"
                  type="text"
                  value={pnrInput}
                  onChange={(e) => setPnrInput(e.target.value)}
                  placeholder="e.g. RC1730312345678A1B2C3D4"
                  maxLength={50}
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50/60 py-3.5 pl-11 pr-4 text-sm font-bold uppercase tracking-wider text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
                {isLoading ? "Checking Status..." : "Track Status"}
              </button>
            </div>
          </form>

          {/* ERROR OR LOGGED OUT MESSAGE */}
          {errorMessage && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold">Unable to display status</p>
                <p className="mt-1 text-xs leading-5 text-red-700">
                  {errorMessage}
                </p>
                {isLoggedOut && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/login?redirect=${encodeURIComponent(
                          `/pnr-status?pnr=${encodeURIComponent(pnrInput.trim())}`
                        )}`
                      )
                    }
                    className="mt-3 inline-block rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                  >
                    Login to view booking
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RESULT SECTION */}
      {booking && (
        <section className="mx-auto mt-8 max-w-4xl px-4 sm:px-6 lg:px-8">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
            {/* CARD HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                  <Ticket size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Booking Reference
                  </p>
                  <p className="text-lg font-black tracking-tight text-slate-900">
                    {booking.bookingReference}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {booking.status === "confirmed" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                    <CheckCircle2 size={15} />
                    Confirmed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200">
                    <XCircle size={15} />
                    Cancelled
                  </span>
                )}
              </div>
            </div>

            {/* TRAIN & ROUTE INFO */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {booking.trainName}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Train No. {booking.trainNumber}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-2.5 text-right">
                  <p className="text-xs font-semibold text-slate-500">Total Fare</p>
                  <p className="mt-0.5 text-lg font-black text-blue-700">
                    {money(booking.totalFare)}
                  </p>
                </div>
              </div>

              {/* ROUTE DISPLAY */}
              <div className="my-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Departure
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">
                    {booking.from}
                  </p>
                </div>

                <div className="flex flex-col items-center text-blue-600">
                  <div className="h-px w-12 bg-blue-200 sm:w-24" />
                  <TrainFront size={22} className="my-1.5" />
                  <div className="h-px w-12 bg-blue-200 sm:w-24" />
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Destination
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">
                    {booking.to}
                  </p>
                </div>
              </div>

              {/* META GRID */}
              <div className="grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-start gap-3">
                  <CalendarDays size={20} className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Journey Date</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {formatDate(booking.journeyDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users size={20} className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Passengers</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {booking.passengerCount} Traveller{booking.passengerCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Ticket size={20} className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Coach & Seats</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {booking.coach} / {booking.seats.join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Wallet size={20} className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Booked On</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* PASSENGER DETAILS BREAKDOWN */}
              {booking.passengers && booking.passengers.length > 0 && (
                <div className="mt-8 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Passenger Breakdown
                  </h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {booking.passengers.map((p, index) => (
                      <div
                        key={`${p.name}-${index}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            {index + 1}. {p.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Age: {p.age} · Gender: {p.gender}
                          </p>
                        </div>
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                          {booking.seats[index] || "Assigned"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
                <Link
                  href="/bookings"
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  ← Go to My Bookings
                </Link>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Print Status Details
                </button>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* REAL RAILWAY DEMO LIMITATION DISCLAIMER */}
      <section className="mx-auto mt-10 max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-6 text-amber-900">
          <Clock3 size={18} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <p className="font-bold">RailConnect Demonstration Notice</p>
            <p className="mt-0.5 text-amber-800">
              This PNR status tracker displays reservation records stored locally within the RailConnect system. It is not connected to official Indian Railways (IRCTC / CRIS) live PRS servers. Fares, seat assignments, and reservation statuses are for project evaluation and academic demonstration purposes only.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PnrStatusPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center bg-slate-50">
          <p className="text-sm font-medium text-slate-600">Loading PNR Status...</p>
        </main>
      }
    >
      <PnrStatusContent />
    </Suspense>
  );
}
