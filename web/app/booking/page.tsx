"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleUserRound,
  Clock3,
  MapPin,
  ShieldCheck,
  Ticket,
  TrainFront,
  Users,
  Wallet,
} from "lucide-react";

type Passenger = {
  name: string;
  age: string;
  gender: string;
};

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const trainNumber = searchParams.get("trainNumber") ?? "";
  const trainName = searchParams.get("trainName") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const date = searchParams.get("date") ?? "";

  const fareParam = Number(searchParams.get("fare") ?? "0");
  const fare = Number.isFinite(fareParam) && fareParam >= 0 ? fareParam : 0;

  const passengerParam = Number(searchParams.get("passengers") ?? "1");
  const passengerCount =
    Number.isInteger(passengerParam) &&
    passengerParam >= 1 &&
    passengerParam <= 6
      ? passengerParam
      : 1;

  const [passengers, setPassengers] = useState<Passenger[]>(
    Array.from({ length: passengerCount }, () => ({
      name: "",
      age: "",
      gender: "",
    })),
  );

  const [error, setError] = useState("");

  function updatePassenger(
    index: number,
    field: keyof Passenger,
    value: string,
  ) {
    setPassengers((current) =>
      current.map((passenger, i) =>
        i === index ? { ...passenger, [field]: value } : passenger,
      ),
    );
  }

  function handleContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trainNumber || !trainName || !from || !to || !date) {
      setError("Train details are missing. Please search for a train again.");
      return;
    }

    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      const age = Number(passenger.age);

      if (!passenger.name.trim()) {
        setError(`Please enter the name of passenger ${i + 1}.`);
        return;
      }

      if (
        passenger.age.trim() === "" ||
        !Number.isInteger(age) ||
        age < 1 ||
        age > 120
      ) {
        setError(`Enter a valid age for passenger ${i + 1} (1–120).`);
        return;
      }

      if (!passenger.gender) {
        setError(`Please select the gender of passenger ${i + 1}.`);
        return;
      }
    }

    const params = new URLSearchParams({
      trainNumber,
      trainName,
      from,
      to,
      date,
      passengers: String(passengerCount),
      fare: String(fare),
      passengerDetails: JSON.stringify(passengers),
    });

    setError("");
    router.push(`/booking/seats?${params.toString()}`);
  }

  return (
    <main className="min-w-0 flex-1 bg-[#f7f8fc] text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-700 px-5 py-12 text-white sm:px-8 sm:py-14">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
            <ShieldCheck size={16} />
            Secure reservation details
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            Passenger information
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
            Add the details of everyone travelling on this journey before
            choosing your seats.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-7 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white">
                <Check size={19} strokeWidth={2.5} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">Passenger details</p>
                <p className="mt-0.5 text-xs text-blue-700">Current step</p>
              </div>

              <div className="hidden h-px flex-1 bg-slate-200 sm:block" />

              <div className="flex items-center gap-2 text-slate-400">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200">
                  <Ticket size={17} />
                </span>
                <span className="hidden text-sm font-medium sm:block">
                  Seats
                </span>
              </div>

              <div className="hidden h-px flex-1 bg-slate-200 sm:block" />

              <div className="flex items-center gap-2 text-slate-400">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200">
                  <ShieldCheck size={17} />
                </span>
                <span className="hidden text-sm font-medium sm:block">
                  Review
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleContinue} className="space-y-5">
            {passengers.map((passenger, index) => (
              <section
                key={index}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-100 sm:p-7"
              >
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <CircleUserRound size={26} strokeWidth={1.7} />
                  </span>

                  <div>
                    <h2 className="text-lg font-extrabold">
                      Passenger {index + 1}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Personal information for this traveller
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`name-${index}`}
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Full name
                    </label>

                    <input
                      id={`name-${index}`}
                      type="text"
                      autoComplete="name"
                      maxLength={80}
                      required
                      value={passenger.name}
                      onChange={(event) =>
                        updatePassenger(index, "name", event.target.value)
                      }
                      placeholder="Enter passenger's full name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`age-${index}`}
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Age
                    </label>

                    <input
                      id={`age-${index}`}
                      type="number"
                      min={1}
                      max={120}
                      required
                      value={passenger.age}
                      onChange={(event) =>
                        updatePassenger(index, "age", event.target.value)
                      }
                      placeholder="Age in years"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`gender-${index}`}
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Gender
                    </label>

                    <select
                      id={`gender-${index}`}
                      required
                      value={passenger.gender}
                      onChange={(event) =>
                        updatePassenger(index, "gender", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </section>
            ))}

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
              <Link
                href="/trains"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <ArrowLeft size={17} />
                Back to trains
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-800"
              >
                Continue to seat selection
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
            <Ticket size={16} />
            Journey summary
          </p>

          <h2 className="mt-4 text-xl font-extrabold">
            {trainName || "No train selected"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {trainNumber ? `Train no. ${trainNumber}` : "Select a train first"}
          </p>

          <div className="my-6 space-y-5 border-y border-slate-100 py-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <MapPin size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">From</p>
                <p className="mt-1 break-words text-sm font-semibold">
                  {from || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <TrainFront size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">To</p>
                <p className="mt-1 break-words text-sm font-semibold">
                  {to || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                <CalendarDays size={18} />
              </span>
              <div>
                <p className="text-xs text-slate-500">Journey date</p>
                <p className="mt-1 text-sm font-semibold">{date || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                <Users size={18} />
              </span>
              <div>
                <p className="text-xs text-slate-500">Passengers</p>
                <p className="mt-1 text-sm font-semibold">{passengerCount}</p>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Estimated total</p>
              <p className="mt-1 text-xs text-slate-400">
                Demo fare × passengers
              </p>
            </div>
            <p className="flex items-center text-2xl font-black text-blue-800">
              <Wallet size={20} className="mr-1" />
              ₹{(fare * passengerCount).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            <Clock3 size={16} className="mt-0.5 shrink-0" />
            <p>
              Sample fare for the project UI only. No real ticket is booked or
              payment collected on this page.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}