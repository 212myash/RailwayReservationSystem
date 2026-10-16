"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  Ticket,
  TrainFront,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

type Booking = {
  id: string;
  bookingReference: string;
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  journeyDate: string;
  passengers: {
    name: string;
    age: number;
    gender: string;
  }[];
  passengerCount: number;
  coach: string;
  seats: string[];
  totalFare: number;
  status: "confirmed" | "cancelled";
  createdAt?: string;
};

function MyBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const confirmedReference = searchParams.get("confirmed") || "";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  async function loadBookings() {
    setIsLoading(true);
    setErrorMessage("");
    setIsLoggedOut(false);

    try {
      const response = await fetch("/api/bookings", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        setIsLoggedOut(true);
        return;
      }

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Bookings load nahi ho paayi.");
        return;
      }

      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (error) {
      console.error("Unable to load bookings:", error);
      setErrorMessage("Server se connect nahi ho paya. Dobara try karo.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadBookings();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const money = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  function formatDate(date: string) {
    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-14">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              RailConnect
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              My Bookings
            </h1>
            <p className="mt-2 text-slate-600">
              View your journey details and booking history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {confirmedReference && !isLoading && !errorMessage && !isLoggedOut && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
              bookings.some(
                (booking) => booking.bookingReference === confirmedReference,
              )
                ? "border-emerald-200 bg-emerald-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            <CheckCircle2
              size={22}
              className="mt-0.5 shrink-0 text-emerald-600"
            />
            <div>
              <p className="font-semibold text-slate-900">
                Booking request completed
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Reference:{" "}
                <span className="font-bold">{confirmedReference}</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Check the booking below to confirm that it appears in your saved
                history.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-blue-700"
            />
            <p className="mt-4 font-medium text-slate-700">
              Loading your bookings...
            </p>
          </div>
        ) : isLoggedOut ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <Ticket size={38} className="mx-auto text-blue-700" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Login required
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Login to view the bookings saved to your account.
            </p>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/login?redirect=${encodeURIComponent("/bookings")}`,
                )
              }
              className="mt-6 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Login to continue
            </button>
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm">
            <XCircle size={36} className="mx-auto text-red-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Could not load bookings
            </h2>
            <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadBookings()}
              className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Try again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <TrainFront size={32} />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No bookings found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Your saved bookings will appear here after they are successfully
              stored in your account.
            </p>
            <Link
              href="/trains"
              className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Find trains
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {bookings.length} booking{bookings.length === 1 ? "" : "s"}{" "}
                found
              </p>
            </div>

            {bookings.map((booking) => (
              <article
                key={booking.id || booking.bookingReference}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                      <Ticket size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        Booking reference
                      </p>
                      <p className="font-bold text-slate-900">
                        {booking.bookingReference}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      booking.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {booking.status === "confirmed" ? "Confirmed" : "Cancelled"}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {booking.trainName}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Train No. {booking.trainNumber}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">Total fare</p>
                      <p className="mt-1 text-lg font-bold text-blue-700">
                        {money(booking.totalFare)}
                      </p>
                    </div>
                  </div>

                  <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div>
                      <p className="break-words text-lg font-bold text-slate-900">
                        {booking.from}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">From</p>
                    </div>

                    <div className="flex flex-col items-center text-blue-600">
                      <div className="h-px w-10 bg-blue-200 sm:w-16" />
                      <TrainFront size={20} className="my-1" />
                      <div className="h-px w-10 bg-blue-200 sm:w-16" />
                    </div>

                    <div className="text-right">
                      <p className="break-words text-lg font-bold text-slate-900">
                        {booking.to}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">To</p>
                    </div>
                  </div>

                  <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-start gap-2.5">
                      <CalendarDays
                        size={18}
                        className="mt-0.5 shrink-0 text-slate-500"
                      />
                      <div>
                        <p className="text-xs text-slate-500">Journey date</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDate(booking.journeyDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Users
                        size={18}
                        className="mt-0.5 shrink-0 text-slate-500"
                      />
                      <div>
                        <p className="text-xs text-slate-500">Passengers</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {booking.passengerCount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Ticket
                        size={18}
                        className="mt-0.5 shrink-0 text-slate-500"
                      />
                      <div>
                        <p className="text-xs text-slate-500">Coach / seats</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {booking.coach} / {booking.seats.join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Wallet
                        size={18}
                        className="mt-0.5 shrink-0 text-slate-500"
                      />
                      <div>
                        <p className="text-xs text-slate-500">Fare</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {money(booking.totalFare)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {booking.passengers?.length > 0 && (
                    <details className="mt-5 rounded-xl border border-slate-200">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        View passenger details
                      </summary>
                      <div className="divide-y divide-slate-100 px-4">
                        {booking.passengers.map((passenger, index) => (
                          <div
                            key={`${passenger.name}-${index}`}
                            className="py-3"
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {index + 1}. {passenger.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Age: {passenger.age} · {passenger.gender}
                            </p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          <Clock3 size={19} className="mt-0.5 shrink-0" />
          <p>
            RailConnect is currently a project demo. Real railway reservation,
            live seat availability and payment verification are not connected.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center bg-slate-50">
          <p className="text-sm font-medium text-slate-600">
            Loading My Bookings...
          </p>
        </main>
      }
    >
      <MyBookingsContent />
    </Suspense>
  );
}
