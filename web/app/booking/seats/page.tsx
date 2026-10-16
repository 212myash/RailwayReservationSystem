
"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Armchair,
  CalendarDays,
  Check,
  Info,
  MapPin,
  ShieldCheck,
  Ticket,
  TrainFront,
  Users,
} from "lucide-react";

const TOTAL_BERTHS = 72;

// Demo availability only. Real availability will come from the database later.
const UNAVAILABLE_BERTHS = [
  3, 8, 12, 17, 22, 28, 31, 37, 44, 49, 55, 63,
];

type BerthType = "LB" | "MB" | "UB" | "SL" | "SU";

type Passenger = {
  name: string;
  age: string;
  gender: string;
  idType?: string;
  idNumber?: string;
  berth?: string;
};

function getBerthType(berthNumber: number): BerthType {
  const position = ((berthNumber - 1) % 8) + 1;

  if (position === 1 || position === 4) return "LB";
  if (position === 2 || position === 5) return "MB";
  if (position === 3 || position === 6) return "UB";
  if (position === 7) return "SL";

  return "SU";
}

function getBerthLabel(berthNumber: number) {
  const type = getBerthType(berthNumber);
  const names: Record<BerthType, string> = {
    LB: "Lower Berth",
    MB: "Middle Berth",
    UB: "Upper Berth",
    SL: "Side Lower",
    SU: "Side Upper",
  };

  return names[type];
}

function getInitialSelection(value: string | null): number[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => {
      const match = item.trim().match(/^\d+/);
      return match ? Number(match[0]) : NaN;
    })
    .filter(
      (number) =>
        Number.isInteger(number) &&
        number >= 1 &&
        number <= TOTAL_BERTHS &&
        !UNAVAILABLE_BERTHS.includes(number)
    )
    .filter((number, index, list) => list.indexOf(number) === index)
    .sort((a, b) => a - b);
}

function SeatSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const trainNumber = searchParams.get("trainNumber") || "";
  const trainName = searchParams.get("trainName") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";

  const fareParam = Number(searchParams.get("fare") || "0");
  const fare =
    Number.isFinite(fareParam) && fareParam >= 0 ? fareParam : 0;

  const passengerParam = Number(searchParams.get("passengers") || "1");
  const passengerCount =
    Number.isInteger(passengerParam) &&
    passengerParam >= 1 &&
    passengerParam <= 6
      ? passengerParam
      : 1;

  const passengerDetailsParam =
    searchParams.get("passengerDetails") || "[]";

  const passengers = useMemo<Passenger[]>(() => {
    try {
      const parsed: unknown = JSON.parse(passengerDetailsParam);

      if (Array.isArray(parsed)) {
        return parsed as Passenger[];
      }

      return [];
    } catch {
      return [];
    }
  }, [passengerDetailsParam]);

  const [selectedBerths, setSelectedBerths] = useState<number[]>(() =>
    getInitialSelection(searchParams.get("seats"))
  );
  const [error, setError] = useState("");

  const formattedDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not selected";

  const totalFare = fare * passengerCount;

  const toggleBerth = (berthNumber: number) => {
    if (UNAVAILABLE_BERTHS.includes(berthNumber)) return;

    setError("");

    setSelectedBerths((current) => {
      if (current.includes(berthNumber)) {
        return current.filter((number) => number !== berthNumber);
      }

      if (current.length >= passengerCount) {
        setError(
          `You can select only ${passengerCount} berth${
            passengerCount > 1 ? "s" : ""
          }.`
        );
        return current;
      }

      return [...current, berthNumber].sort((a, b) => a - b);
    });
  };

  const handleContinue = () => {
    setError("");

    if (!trainNumber || !trainName || !from || !to || !date) {
      setError(
        "Train or journey details are missing. Please select your train again."
      );
      return;
    }

    if (selectedBerths.length !== passengerCount) {
      setError(
        `Please select exactly ${passengerCount} berth${
          passengerCount > 1 ? "s" : ""
        } to continue.`
      );
      return;
    }

    if (passengers.length !== passengerCount) {
      setError(
        "Passenger details could not be verified. Please go back and enter them again."
      );
      return;
    }

    const berthDetails = selectedBerths.map((number) => ({
      number,
      type: getBerthType(number),
      label: getBerthLabel(number),
    }));

    const params = new URLSearchParams({
      trainNumber,
      trainName,
      from,
      to,
      date,
      passengers: String(passengerCount),
      fare: String(fare),
      seats: berthDetails
        .map((berth) => `${berth.number} (${berth.type})`)
        .join(","),
      berthDetails: JSON.stringify(berthDetails),
      coach: "S1",
      passengerDetails: JSON.stringify(passengers),
    });

    router.push(`/booking/review?${params.toString()}`);
  };

  const renderBerth = (berthNumber: number) => {
    const unavailable = UNAVAILABLE_BERTHS.includes(berthNumber);
    const selected = selectedBerths.includes(berthNumber);
    const berthType = getBerthType(berthNumber);

    const berthClass = unavailable
      ? "cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400"
      : selected
        ? "border-blue-700 bg-blue-700 text-white shadow-md shadow-blue-700/20"
        : "border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:bg-blue-50";

    return (
      <button
        key={berthNumber}
        type="button"
        disabled={unavailable}
        aria-label={`Berth ${berthNumber}, ${getBerthLabel(berthNumber)}${
          unavailable
            ? ", unavailable"
            : selected
              ? ", selected"
              : ", available"
        }`}
        aria-pressed={selected}
        title={`${getBerthLabel(berthNumber)}${
          unavailable ? " - Unavailable" : ""
        }`}
        onClick={() => toggleBerth(berthNumber)}
        className={`flex min-h-[68px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border p-1 transition sm:min-h-[76px] ${berthClass}`}
      >
        {selected ? <Check size={17} /> : <Armchair size={17} />}
        <span className="text-sm font-extrabold">{berthNumber}</span>
        <span className="text-[10px] font-bold sm:text-xs">
          {berthType}
        </span>
      </button>
    );
  };

  const bays = Array.from({ length: 9 }, (_, index) => {
    const first = index * 8 + 1;

    return {
      number: index + 1,
      mainBerths: [first, first + 1, first + 2, first + 3, first + 4, first + 5],
      sideBerths: [first + 6, first + 7],
    };
  });

  return (
    <main className="min-w-0 flex-1 bg-[#f7f8fc] text-slate-900">
      <section className="bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-700 px-5 py-10 text-white sm:px-8 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-7 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/20"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
            Reservation details
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            Select your berth
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
            Choose Lower, Middle, Upper, Side Lower or Side Upper berth for
            each passenger.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-7 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="mb-7 flex items-center gap-2 overflow-hidden text-xs font-bold sm:gap-3 sm:text-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check size={16} />
            </span>
            <span className="text-emerald-700">Passengers</span>

            <span className="h-px min-w-3 flex-1 bg-blue-300" />

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white">
              2
            </span>
            <span className="text-blue-800">Berths</span>

            <span className="h-px min-w-3 flex-1 bg-slate-200" />

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              3
            </span>
            <span className="text-slate-400">Review</span>
          </div>

          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <TrainFront size={25} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold sm:text-xl">
                  {trainName || "Train details unavailable"}
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Train No. {trainNumber || "—"}
                </p>

                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold">
                      {from || "Origin"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Departure</p>
                  </div>

                  <div className="flex items-center text-blue-600">
                    <span className="h-px w-5 bg-blue-300 sm:w-10" />
                    <TrainFront size={18} />
                    <span className="h-px w-5 bg-blue-300 sm:w-10" />
                  </div>

                  <div className="min-w-0 text-right">
                    <p className="truncate text-base font-extrabold">
                      {to || "Destination"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Arrival</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={16} className="text-blue-600" />
                    {formattedDate}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    {passengerCount} passenger
                    {passengerCount > 1 ? "s" : ""}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <Armchair size={16} className="text-blue-600" />
                    Sleeper · Coach S1
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold">Sleeper berth layout</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select {passengerCount} berth
                  {passengerCount > 1 ? "s" : ""} for your journey.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                <Armchair size={17} />
                Coach S1
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-600 sm:grid-cols-3">
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded-md border border-slate-300 bg-white" />
                Available
              </span>

              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded-md bg-blue-700" />
                Selected
              </span>

              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded-md bg-slate-300" />
                Unavailable
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              {([
                ["LB", "Lower Berth"],
                ["MB", "Middle Berth"],
                ["UB", "Upper Berth"],
                ["SL", "Side Lower"],
                ["SU", "Side Upper"],
              ] as [BerthType, string][]).map(([type, label]) => (
                <span
                  key={type}
                  className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-blue-900"
                >
                  <strong>{type}</strong> · {label}
                </span>
              ))}
            </div>

            <div className="mt-7 flex items-center justify-center gap-3 rounded-t-2xl border border-b-0 border-slate-200 bg-slate-50 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              <TrainFront size={17} />
              Coach S1 · Berth map
            </div>

            <div className="space-y-5 rounded-b-2xl border border-slate-200 p-3 sm:p-5">
              {bays.map((bay) => (
                <div
                  key={bay.number}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                      Bay {bay.number}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Main berths + side berths
                    </span>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)] gap-2 sm:gap-3">
                    {bay.mainBerths.slice(0, 3).map(renderBerth)}
                    {bay.sideBerths.slice(0, 1).map(renderBerth)}

                    {bay.mainBerths.slice(3, 6).map(renderBerth)}
                    {bay.sideBerths.slice(1, 2).map(renderBerth)}
                  </div>

                  <div className="mt-2 grid grid-cols-4 gap-2 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[10px]">
                    <span>Main berth</span>
                    <span>Main berth</span>
                    <span>Main berth</span>
                    <span>Side berth</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              <Info size={16} className="mt-0.5 shrink-0" />
              This is a demo berth map with illustrative availability. It is
              not connected to live railway inventory. Actual coach layouts
              and berth allocation may differ.
            </p>
          </section>
        </div>

        <aside className="min-w-0">
          <div className="sticky top-6 space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Ticket size={22} />
                </div>

                <div>
                  <h2 className="font-extrabold">Booking summary</h2>
                  <p className="text-xs text-slate-500">
                    Your current selection
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Passengers</span>
                  <span className="font-bold">{passengerCount}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Coach</span>
                  <span className="font-bold">S1</span>
                </div>

                <div>
                  <span className="text-slate-500">Selected berths</span>

                  {selectedBerths.length ? (
                    <div className="mt-3 space-y-2">
                      {selectedBerths.map((number) => (
                        <div
                          key={number}
                          className="flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-3 py-2.5"
                        >
                          <div>
                            <p className="font-bold text-blue-950">
                              Berth {number}
                            </p>
                            <p className="mt-0.5 text-xs text-blue-700">
                              {getBerthLabel(number)}
                            </p>
                          </div>
                          <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-extrabold text-blue-800">
                            {getBerthType(number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-right font-bold text-slate-400">
                      None selected
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">
                      Fare per passenger
                    </span>
                    <span className="font-semibold">
                      ₹{fare.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="font-bold">Estimated total</span>
                    <span className="text-xl font-black text-blue-800">
                      ₹{totalFare.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleContinue}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
              >
                Continue to Review
                <ArrowRight size={17} />
              </button>

              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500">
                <ShieldCheck
                  size={15}
                  className="shrink-0 text-emerald-600"
                />
                Review your details before confirming.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <MapPin
                  size={19}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <h3 className="text-sm font-bold text-blue-950">
                    Journey information
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    {from || "Origin"} to {to || "Destination"} on{" "}
                    {formattedDate}.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function SeatSelectionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[50vh] items-center justify-center bg-[#f7f8fc] px-5 text-slate-600">
          <p className="text-sm font-semibold">Loading seat selection...</p>
        </main>
      }
    >
      <SeatSelectionContent />
    </Suspense>
  );
}
