"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Ticket,
  TrainFront,
  Users,
  Wallet,
} from "lucide-react";

type Passenger = {
  name?: string;
  age?: number | string;
  gender?: string;
};

function BookingReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const trainNumber = searchParams.get("trainNumber") || "";
  const trainName = searchParams.get("trainName") || "Selected Train";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const passengersCount = Number(searchParams.get("passengers") || 0);
  const fare = Number(searchParams.get("fare") || 0);
  const coach = searchParams.get("coach") || "S1";

  const seats = (searchParams.get("seats") || "")
    .split(",")
    .map((seat) => seat.trim())
    .filter(Boolean);

  const passengers = useMemo<Passenger[]>(() => {
    try {
      const value = searchParams.get("passengerDetails");

      if (!value) return [];

      const parsed: unknown = JSON.parse(value);

      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (item): item is Passenger => typeof item === "object" && item !== null,
      );
    } catch {
      return [];
    }
  }, [searchParams]);

  const validFare = Number.isFinite(fare) && fare >= 0;

  const validPassengerCount =
    Number.isInteger(passengersCount) &&
    passengersCount >= 1 &&
    passengersCount <= 6;

  const passengerDetailsValid =
    passengers.length === passengersCount &&
    passengers.every(
      (passenger) =>
        typeof passenger.name === "string" &&
        passenger.name.trim().length >= 2 &&
        passenger.name.trim().length <= 80 &&
        Number.isInteger(Number(passenger.age)) &&
        Number(passenger.age) >= 1 &&
        Number(passenger.age) <= 120 &&
        ["Male", "Female", "Other"].includes(String(passenger.gender)),
    );

  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime()) &&
    new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) === date;

  const canContinue =
    Boolean(trainNumber.trim()) &&
    Boolean(trainName.trim()) &&
    Boolean(from.trim()) &&
    Boolean(to.trim()) &&
    from.trim().toLowerCase() !== to.trim().toLowerCase() &&
    validDate &&
    validFare &&
    validPassengerCount &&
    seats.length === passengersCount &&
    seats.every((seat) => /^[A-Za-z0-9 ()-]{1,12}$/.test(seat)) &&
    new Set(seats).size === seats.length &&
    passengerDetailsValid &&
    /^[A-Za-z0-9-]{1,10}$/.test(coach);
  console.log("BOOKING VALIDATION:", {
    trainNumber,
    trainName,
    from,
    to,
    date,
    validDate,
    fare,
    validFare,
    passengersCount,
    validPassengerCount,
    passengers,
    passengerDetailsValid,
    seats,
    seatCount: seats.length,
    seatCountMatches: seats.length === passengersCount,
    validSeatFormat: seats.every((seat) => /^[A-Za-z0-9 ()-]{1,12}$/.test(seat)),
    uniqueSeats: new Set(seats).size === seats.length,
    coach,
    validCoach: /^[A-Za-z0-9-]{1,10}$/.test(coach),
    canContinue,
  });

  const formattedDate = (() => {
    if (!date) return "Not selected";

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  })();

  const money = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  function goBack() {
    const params = new URLSearchParams();

    searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    router.push(`/booking/seats?${params.toString()}`);
  }

  async function continueReview() {
    if (!canContinue || isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      // Verify the current login session.
      const authResponse = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      const authData = await authResponse.json();

      if (!authResponse.ok || !authData.success || !authData.user) {
        const currentUrl = window.location.pathname + window.location.search;

        router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);

        return;
      }

      // Submit the booking to the server.
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainNumber,
          trainName,
          from,
          to,
          date,
          passengers: passengers.map((passenger) => ({
            name: passenger.name?.trim(),
            age: Number(passenger.age),
            gender: passenger.gender,
          })),
          passengerCount: passengersCount,
          coach,
          seats,
          fare,
        }),
      });

      const bookingData = await bookingResponse.json();

      if (!bookingResponse.ok || !bookingData.success) {
        setErrorMessage(
          bookingData.message || "Booking save nahi ho payi. Dobara try karo.",
        );
        return;
      }

      const reference = bookingData.booking?.bookingReference;

      if (!reference) {
        setErrorMessage(
          "Booking response mein reference nahi mila. My Bookings check karo.",
        );
        return;
      }

      // Booking is saved. Open the booking history page.
      router.push(`/bookings?confirmed=${encodeURIComponent(reference)}`);
    } catch (error) {
      console.error("Booking submission failed:", error);

      setErrorMessage(
        "Server se connect nahi ho paya. Please dobara try karo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/trains"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to trains
        </Link>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            RailConnect booking
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Review your journey
          </h1>

          <p className="mt-2 text-slate-600">
            Check your train, passenger and seat details before proceeding.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-3">
          {[
            { number: "01", label: "Passengers", complete: true },
            { number: "02", label: "Select seats", complete: true },
            { number: "03", label: "Review", complete: false },
          ].map((step, index) => (
            <div
              key={step.number}
              className={`rounded-xl border p-3 sm:p-4 ${
                index === 2
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                {step.complete ? (
                  <CheckCircle2
                    size={19}
                    className="shrink-0 text-emerald-600"
                  />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                    3
                  </span>
                )}

                <span className="text-xs font-semibold text-slate-500">
                  STEP {step.number}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                {step.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                  <TrainFront size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">Train details</h2>
                  <p className="text-sm text-slate-500">
                    Your selected journey
                  </p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {trainName}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Train No. {trainNumber || "Not available"}
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Selected train
                  </span>
                </div>

                <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div>
                    <p className="text-xl font-bold text-slate-900">
                      {from || "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">From</p>
                  </div>

                  <div className="flex flex-col items-center text-blue-600">
                    <div className="h-px w-12 bg-blue-200 sm:w-20" />
                    <TrainFront size={20} className="my-1" />
                    <div className="h-px w-12 bg-blue-200 sm:w-20" />
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">
                      {to || "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">To</p>
                  </div>
                </div>

                <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <CalendarDays size={19} className="text-slate-500" />

                    <div>
                      <p className="text-xs text-slate-500">Journey date</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formattedDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users size={19} className="text-slate-500" />

                    <div>
                      <p className="text-xs text-slate-500">Passengers</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {validPassengerCount ? passengersCount : "Not selected"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700">
                  <Users size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Passenger details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Verify the details entered
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 px-5">
                {passengers.length > 0 ? (
                  passengers.map((passenger, index) => (
                    <div
                      key={`${passenger.name}-${index}`}
                      className="flex items-center justify-between gap-3 py-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {index + 1}. {passenger.name || "Unnamed passenger"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Age: {passenger.age || "—"} ·{" "}
                          {passenger.gender || "—"}
                        </p>
                      </div>

                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        Passenger {index + 1}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-5 text-sm text-amber-700">
                    Passenger details are missing. Go back and check your
                    passenger information.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                  <Ticket size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">Seat details</h2>
                  <p className="text-sm text-slate-500">
                    Selected coach and seats
                  </p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Coach</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {coach}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Selected seats</p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {seats.length > 0 ? (
                        seats.map((seat) => (
                          <span
                            key={seat}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700"
                          >
                            {seat}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-amber-700">
                          No seats selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Wallet size={22} className="text-blue-700" />
                <h2 className="text-lg font-bold text-slate-900">
                  Fare summary
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-600">Fare per passenger</span>

                  <span className="font-medium text-slate-900">
                    {validPassengerCount && validFare
                      ? money(fare / passengersCount)
                      : "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-600">Passengers</span>
                  <span className="font-medium text-slate-900">
                    {validPassengerCount ? passengersCount : "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-600">Seat selection</span>
                  <span className="font-medium text-slate-900">
                    {seats.length} seat{seats.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">
                      Total fare
                    </span>

                    <span className="text-2xl font-bold text-blue-700">
                      {validFare ? money(fare) : "—"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Displayed fare is for this demo. Real fare verification and
                    payment are not connected yet.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={continueReview}
                disabled={!canContinue || isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? "Processing booking..." : "Confirm booking"}
                {!isSubmitting && <ArrowRight size={18} />}
              </button>

              {errorMessage && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {errorMessage}
                </p>
              )}

              {!canContinue && (
                <p className="mt-3 text-xs leading-5 text-amber-700">
                  Some booking details are missing or invalid. Go back and
                  verify your passenger information, journey and seats.
                </p>
              )}

              <button
                type="button"
                onClick={goBack}
                disabled={isSubmitting}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft size={17} />
                Edit booking
              </button>
            </section>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={21}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div>
                  <p className="font-semibold text-emerald-900">
                    Account-linked booking
                  </p>

                  <p className="mt-1 text-sm leading-5 text-emerald-800">
                    Login is checked before the booking is submitted to the
                    database. You will continue to your bookings page after a
                    successful save.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Clock3 size={15} />
              <span>Review your details before proceeding</span>
            </div>
          </aside>
        </div>

        <div className="mt-8 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <MapPin size={18} className="shrink-0 text-blue-700" />
          Please verify your journey date, route, passenger details and seat
          selection before continuing.
        </div>
      </div>
    </main>
  );
}

export default function BookingReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center bg-slate-50">
          <p className="text-sm font-medium text-slate-600">
            Loading booking details...
          </p>
        </main>
      }
    >
      <BookingReviewContent />
    </Suspense>
  );
}
