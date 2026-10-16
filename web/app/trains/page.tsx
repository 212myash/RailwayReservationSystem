"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CalendarDays,
  CircleAlert,
  Clock3,
  IndianRupee,
  Search,
  SlidersHorizontal,
  Ticket,
  TrainFront,
  Users,
} from "lucide-react";

type Train = {
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  fare: number;
  availableSeats: number;
};

const DEMO_TRAINS: Train[] = [
  {
    trainNumber: "12002",
    trainName: "Shatabdi Express",
    source: "New Delhi",
    destination: "Chandigarh",
    departure: "07:20",
    arrival: "10:45",
    duration: "3h 25m",
    fare: 850,
    availableSeats: 32,
  },
  {
    trainNumber: "12424",
    trainName: "Dibrugarh Rajdhani",
    source: "New Delhi",
    destination: "Patna",
    departure: "16:20",
    arrival: "04:30",
    duration: "12h 10m",
    fare: 1450,
    availableSeats: 18,
  },
  {
    trainNumber: "12310",
    trainName: "Rajendra Nagar Express",
    source: "New Delhi",
    destination: "Patna",
    departure: "17:55",
    arrival: "07:10",
    duration: "13h 15m",
    fare: 720,
    availableSeats: 12,
  },
  {
    trainNumber: "12005",
    trainName: "Kalka Shatabdi",
    source: "New Delhi",
    destination: "Chandigarh",
    departure: "17:15",
    arrival: "20:45",
    duration: "3h 30m",
    fare: 900,
    availableSeats: 24,
  },
];

export default function TrainsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const date = searchParams.get("date") ?? "";

  const passengerParam = Number(searchParams.get("passengers") ?? "1");
  const passengers =
    Number.isInteger(passengerParam) &&
    passengerParam >= 1 &&
    passengerParam <= 6
      ? passengerParam
      : 1;

  const [sortBy, setSortBy] = useState("fare");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const filteredTrains = useMemo(() => {
    let result = DEMO_TRAINS.filter((train) => {
      const sourceMatches =
        !from || train.source.toLowerCase().includes(from.toLowerCase());

      const destinationMatches =
        !to || train.destination.toLowerCase().includes(to.toLowerCase());

      return sourceMatches && destinationMatches;
    });

    if (showAvailableOnly) {
      result = result.filter((train) => train.availableSeats >= passengers);
    }

    return [...result].sort((a, b) => {
      if (sortBy === "number") {
        return a.trainNumber.localeCompare(b.trainNumber);
      }

      if (sortBy === "fare-high") {
        return b.fare - a.fare;
      }

      return a.fare - b.fare;
    });
  }, [from, to, passengers, sortBy, showAvailableOnly]);

  async function bookTrain(train: Train) {
    const params = new URLSearchParams({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      from: train.source,
      to: train.destination,
      date,
      passengers: String(passengers),
      fare: String(train.fare),
    });

    const bookingUrl = `/booking?${params.toString()}`;

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        router.push(bookingUrl);
        return;
      }
    } catch (error) {
      console.error("Unable to verify login:", error);
    }

    router.push(`/login?redirect=${encodeURIComponent(bookingUrl)}`);
  }

  return (
    <main className="min-w-0 flex-1 bg-[#f7f8fc] text-slate-900">
      <section className="bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-700 px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
            <TrainFront size={16} />
            Find your journey
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            Available trains
          </h1>

          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-blue-100 sm:text-base">
            <span>{from || "Any station"}</span>
            <ArrowRight size={16} />
            <span>{to || "Any destination"}</span>
            {date && (
              <>
                <span className="text-blue-300">·</span>
                <CalendarDays size={15} />
                <span>{date}</span>
              </>
            )}
            <span className="text-blue-300">·</span>
            <Users size={16} />
            <span>
              {passengers} passenger{passengers > 1 ? "s" : ""}
            </span>
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10"
          >
            <ArrowLeft size={17} />
            Change search
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold">
              <TrainFront size={25} className="text-blue-700" />
              Train results
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredTrains.length} matching train
              {filteredTrains.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-blue-300">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(event) => setShowAvailableOnly(event.target.checked)}
                className="h-4 w-4 accent-blue-700"
              />
              <Users size={16} className="text-slate-500" />
              Enough seats
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <SlidersHorizontal size={16} className="text-slate-500" />
              <span className="text-slate-500">Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="max-w-40 bg-transparent font-semibold outline-none"
              >
                <option value="fare">Fare: Low to High</option>
                <option value="fare-high">Fare: High to Low</option>
                <option value="number">Train Number</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          <CircleAlert size={20} className="mt-0.5 shrink-0 text-blue-700" />
          <p>
            <strong>Demo data:</strong> These train schedules, fares and seat
            counts are sample values for the initial UI. They are not live
            railway availability or official booking information.
          </p>
        </div>

        <div className="space-y-5">
          {filteredTrains.map((train) => (
            <article
              key={train.trainNumber}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-lg sm:p-7"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-extrabold sm:text-xl">
                      {train.trainName}
                    </h3>
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">
                      #{train.trainNumber}
                    </span>
                  </div>

                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPinIcon />
                    {train.source} to {train.destination}
                  </p>
                </div>

                <div className="grid grid-cols-3 items-center gap-3 sm:gap-8 lg:min-w-97.5">
                  <div>
                    <p className="text-xl font-extrabold">{train.departure}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {train.source}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500">
                      <Clock3 size={13} />
                      {train.duration}
                    </p>
                    <div className="my-2 flex items-center">
                      <div className="h-px flex-1 bg-slate-300" />
                      <ArrowRight
                        size={17}
                        className="mx-2 shrink-0 text-blue-700"
                      />
                      <div className="h-px flex-1 bg-slate-300" />
                    </div>
                    <p className="text-[10px] text-slate-400">Journey</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-extrabold">{train.arrival}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {train.destination}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <IndianRupee size={13} />
                      Sample fare / passenger
                    </p>
                    <p className="mt-1 text-2xl font-black text-blue-800">
                      ₹{train.fare.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Ticket size={14} />
                      Sample seats available
                    </p>
                    <p
                      className={`mt-1 font-bold ${
                        train.availableSeats >= passengers
                          ? "text-emerald-700"
                          : "text-red-600"
                      }`}
                    >
                      {train.availableSeats}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={train.availableSeats < passengers}
                  onClick={() => bookTrain(train)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {train.availableSeats >= passengers
                    ? "Book journey"
                    : "Not enough seats"}
                  {train.availableSeats >= passengers && (
                    <ArrowRight size={18} />
                  )}
                </button>
              </div>
            </article>
          ))}

          {filteredTrains.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Search size={31} strokeWidth={1.7} />
              </div>
              <h3 className="mt-4 text-xl font-extrabold">
                No matching trains
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                These demo results only contain a few sample routes. Try New
                Delhi to Patna or New Delhi to Chandigarh, or return home to
                change your search.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
              >
                <Search size={17} />
                Search again
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function MapPinIcon() {
  return <TrainFront size={15} className="shrink-0 text-slate-400" />;
}
