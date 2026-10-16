
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrainFront,
  Users,
} from "lucide-react";

const features = [
  {
    number: "01",
    title: "Find your train",
    description: "Explore routes and compare journey options in one place.",
    Icon: TrainFront,
    href: "#plan-your-trip",
  },
  {
    number: "02",
    title: "Explore stations",
    description: "Discover departure and destination stations with ease.",
    Icon: MapPin,
    href: "/stations",
  },
  {
    number: "03",
    title: "Plan a journey",
    description: "Choose your travel date and the number of passengers.",
    Icon: CalendarDays,
    href: "#plan-your-trip",
  },
  {
    number: "04",
    title: "Manage bookings",
    description: "Sign in to access your reservation information.",
    Icon: Ticket,
    href: "/bookings",
  },
];

export default function Home() {
  const router = useRouter();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [journeyDate, setJourneyDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  const today = new Date().toLocaleDateString("en-CA");

  function swapStations() {
    setFrom(to);
    setTo(from);
    setError("");
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!from.trim() || !to.trim()) {
      setError("Please enter both departure and destination stations.");
      return;
    }

    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      setError("Departure and destination cannot be the same.");
      return;
    }

    if (!journeyDate) {
      setError("Please select your journey date.");
      return;
    }

    if (journeyDate < today) {
      setError("Journey date cannot be in the past.");
      return;
    }

    const params = new URLSearchParams({
      from: from.trim(),
      to: to.trim(),
      date: journeyDate,
      passengers,
    });

    setError("");
    setSearching(true);
    router.push(`/trains?${params.toString()}`);
  }

  return (
    <main className="min-w-0 flex-1 overflow-hidden bg-[#f6f8fd] text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#101e55] via-[#1745b9] to-[#4b36d4]">
        <div className="pointer-events-none absolute -right-24 top-10 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-36 pt-16 sm:px-8 sm:pb-40 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold tracking-wide text-blue-50 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              SMARTER TRAIN TRAVEL STARTS HERE
            </div>

            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Every journey
              <br />
              has a <span className="text-blue-300">better</span>
              <br />
              beginning.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-blue-100 sm:text-lg">
              Discover trains, explore routes and plan your next journey with
              a simpler railway reservation experience.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/95">
              <span className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <CircleCheck size={17} className="text-blue-200" />
                Easy train search
              </span>
              <span className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <CircleCheck size={17} className="text-blue-200" />
                Simple reservations
              </span>
            </div>
          </div>

          {/* Decorative journey card */}
          <div className="relative mx-auto hidden w-full max-w-lg lg:block">
            <div className="absolute inset-10 rounded-full bg-blue-300/20 blur-3xl" />

            <div className="relative rounded-[30px] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:bg-white/[0.13]">
              <div className="flex items-center justify-between border-b border-white/15 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Travel your way
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">
                    Your next destination
                  </p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-blue-100">
                  <TrainFront size={27} />
                </span>
              </div>

              <div className="py-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-800 shadow-lg shadow-blue-950/10">
                    <Navigation size={25} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-200">
                      START YOUR JOURNEY
                    </p>
                    <p className="mt-1 text-xl font-bold text-white">
                      Your city
                    </p>
                  </div>
                </div>

                <div className="ml-7 h-12 border-l-2 border-dashed border-blue-200/60" />

                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-300 text-blue-950">
                    <MapPin size={25} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-200">
                      YOUR DESTINATION
                    </p>
                    <p className="mt-1 text-xl font-bold text-white">
                      New adventures
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="#plan-your-trip"
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/15"
              >
                <div>
                  <p className="text-xs text-blue-200">
                    THE JOURNEY MATTERS
                  </p>
                  <p className="mt-1 font-bold text-white">
                    Sit back. Travel better.
                  </p>
                </div>
                <ArrowRight
                  size={23}
                  className="text-white transition-transform group-hover:translate-x-1"
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PREMIUM TRIP PLANNER */}
      <section
        id="plan-your-trip"
        className="relative z-10 mx-auto -mt-24 max-w-7xl scroll-mt-28 px-4 sm:-mt-28 sm:px-8"
      >
        <div className="overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_25px_80px_-30px_rgba(15,23,42,0.20)] sm:rounded-[34px]">
          <div className="flex flex-col justify-between gap-5 border-b border-slate-100 px-5 py-7 sm:px-8 sm:py-9 lg:flex-row lg:items-center lg:px-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
                <Sparkles size={15} />
                Plan your trip
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Where would you like to go?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Enter your route and travel date to find matching trains.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-bold tracking-wide text-blue-800">
              <Ticket size={16} />
              TRAIN RESERVATIONS
            </div>
          </div>

          <form onSubmit={handleSearch} className="p-5 sm:p-8 lg:p-10">
            <div className="grid gap-4 lg:grid-cols-[1fr_44px_1fr_1fr_0.85fr] lg:items-end">
              {/* FROM */}
              <div className="min-w-0">
                <label
                  htmlFor="from"
                  className="mb-2.5 block text-sm font-bold text-slate-700"
                >
                  From
                </label>
                <div className="group rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 transition duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.08)] hover:border-slate-300">
                  <input
                    id="from"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    placeholder="Departure station"
                    autoComplete="off"
                    maxLength={100}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
                  />
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin size={14} />
                    City or station code
                  </p>
                </div>
              </div>

              {/* SWAP */}
              <button
                type="button"
                onClick={swapStations}
                aria-label="Swap departure and destination"
                title="Swap stations"
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-700 shadow-sm transition duration-300 hover:rotate-180 hover:border-blue-300 hover:bg-blue-50 lg:mb-5"
              >
                <ArrowLeftRight size={19} />
              </button>

              {/* TO */}
              <div className="min-w-0">
                <label
                  htmlFor="to"
                  className="mb-2.5 block text-sm font-bold text-slate-700"
                >
                  To
                </label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 transition duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.08)] hover:border-slate-300">
                  <input
                    id="to"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    placeholder="Destination station"
                    autoComplete="off"
                    maxLength={100}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
                  />
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <Navigation size={14} />
                    Where are you going?
                  </p>
                </div>
              </div>

              {/* DATE */}
              <div className="min-w-0">
                <label
                  htmlFor="journeyDate"
                  className="mb-2.5 block text-sm font-bold text-slate-700"
                >
                  Journey date
                </label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 transition duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.08)] hover:border-slate-300">
                  <input
                    id="journeyDate"
                    type="date"
                    min={today}
                    required
                    value={journeyDate}
                    onChange={(event) => setJourneyDate(event.target.value)}
                    className="w-full min-w-0 bg-transparent text-sm font-bold text-slate-900 outline-none"
                  />
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays size={14} />
                    Select travel date
                  </p>
                </div>
              </div>

              {/* PASSENGERS */}
              <div className="min-w-0">
                <label
                  htmlFor="passengers"
                  className="mb-2.5 block text-sm font-bold text-slate-700"
                >
                  Passengers
                </label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 transition duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.08)] hover:border-slate-300">
                  <div className="flex items-center gap-2">
                    <Users size={17} className="shrink-0 text-blue-600" />
                    <select
                      id="passengers"
                      value={passengers}
                      onChange={(event) => setPassengers(event.target.value)}
                      className="w-full min-w-0 appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6].map((count) => (
                        <option key={count} value={count}>
                          {count} passenger{count > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="shrink-0 text-slate-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Up to 6 passengers
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-7 flex flex-col gap-5 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-sm leading-6 text-slate-500">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
                <span>
                  <span className="font-bold text-slate-700">
                    Ready to travel?
                  </span>
                  <br className="hidden sm:block" /> Choose your route and date
                  before searching.
                </span>
              </p>

              <button
                type="submit"
                disabled={searching}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 px-7 py-4 font-bold text-white shadow-lg shadow-blue-700/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-700/25 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
              >
                <Search size={19} />
                {searching ? "Searching..." : "Search trains"}
                <ArrowRight
                  size={19}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </form>

          <div className="grid border-t border-slate-100 bg-slate-50/70 sm:grid-cols-3">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r sm:px-7">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                <TrainFront size={19} />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Simple search
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Enter your route
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r sm:px-7">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm">
                <Clock3 size={19} />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Plan ahead
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Select your travel date
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-4 sm:px-7">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <Check size={19} />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Easy planning
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Choose your passengers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 sm:pb-24 sm:pt-24">
        <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
              <Sparkles size={15} />
              Built around your journey
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Everything you need.
              <br className="hidden sm:block" /> All in one place.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-500">
            Find routes, plan your travel and access your booking options
            through a simple, modern interface.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ number, title, description, Icon, href }) => (
            <Link
              key={number}
              href={href}
              className="group relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_-25px_rgba(15,23,42,0.2)] transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[0_25px_45px_-25px_rgba(37,99,235,0.25)]"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-100/70 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" />

              <div className="relative flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 transition duration-300 group-hover:bg-blue-700 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-700/20">
                  <Icon size={24} strokeWidth={1.8} />
                </span>
                <span className="text-sm font-extrabold tracking-wider text-slate-300 transition group-hover:text-blue-600">
                  {number}
                </span>
              </div>

              <h3 className="relative mt-7 text-lg font-extrabold tracking-tight text-slate-900 transition group-hover:text-blue-700">
                {title}
              </h3>

              <p className="relative mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                {description}
              </p>

              <div className="relative mt-6 flex items-center gap-2 text-sm font-bold text-blue-700">
                Explore
                <ArrowUpRight
                  size={17}
                  className="transition duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
