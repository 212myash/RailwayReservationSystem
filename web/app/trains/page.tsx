"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Compass,
  Filter,
  IndianRupee,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  TrainFront,
  Users,
  X,
} from "lucide-react";
import StationCombobox from "@/components/StationCombobox";
import RouteDetailsModal, { RouteModalTrain, RouteStop } from "@/components/RouteDetailsModal";

export type Train = {
  id: string;
  trainNumber: string;
  trainName: string;
  category: string;
  source: string;
  sourceCode: string;
  destination: string;
  destinationCode: string;
  departure: string;
  arrival: string;
  duration: string;
  durationMinutes: number;
  dayOffset: number;
  fare: number;
  totalSeats: number;
  availableSeats: number;
  coachTypes: string[];
  runsOn: string[];
  scheduleUnknown?: boolean;
  intermediateStopsCount: number;
  totalRouteStops: number;
  stops: RouteStop[];
  routeOrigin?: string;
  routeOriginCode?: string;
  routeDestination?: string;
  routeDestinationCode?: string;
  isDemo?: boolean;
};

type SearchFacets = {
  categories: string[];
  coachClasses: string[];
  minFare: number;
  maxFare: number;
  totalBeforeFilters: number;
};

function getTodayIST(): string {
  const nowIST = new Date(Date.now() + 19800000);
  return nowIST.toISOString().split("T")[0];
}

function TrainsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search parameters from URL
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const dateParam = searchParams.get("date") ?? "";
  const passengersParam = Number(searchParams.get("passengers") ?? "1");
  const passengersCount =
    Number.isInteger(passengersParam) && passengersParam >= 1 && passengersParam <= 6
      ? passengersParam
      : 1;

  // In-Page Search Bar form state
  const [fromStation, setFromStation] = useState(fromParam);
  const [toStation, setToStation] = useState(toParam);
  const [journeyDate, setJourneyDate] = useState(dateParam);
  const [passengers, setPassengers] = useState(String(passengersCount));
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDepTime, setSelectedDepTime] = useState("all");
  const [selectedArrTime, setSelectedArrTime] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("departure-asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Data & Modal States
  const [trains, setTrains] = useState<Train[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [facets, setFacets] = useState<SearchFacets>({
    categories: [],
    coachClasses: [],
    minFare: 0,
    maxFare: 0,
    totalBeforeFilters: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isPastDateWarning, setIsPastDateWarning] = useState(false);
  const [selectedRouteTrain, setSelectedRouteTrain] = useState<RouteModalTrain | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync inputs with URL params
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFromStation(fromParam);
    setToStation(toParam);
    setJourneyDate(dateParam);
    setPassengers(String(passengersCount));
  }, [fromParam, toParam, dateParam, passengersCount]);

  // Main data fetching function
  const fetchTrains = useCallback(
    async (pageToFetch = 1) => {
      setIsLoading(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams();
        if (fromParam) params.set("from", fromParam);
        if (toParam) params.set("to", toParam);
        if (dateParam) params.set("date", dateParam);
        if (selectedCategory !== "all") params.set("category", selectedCategory);
        if (selectedClass !== "all") params.set("class", selectedClass);
        if (selectedDepTime !== "all") params.set("depTime", selectedDepTime);
        if (selectedArrTime !== "all") params.set("arrTime", selectedArrTime);
        if (selectedDuration !== "all") params.set("duration", selectedDuration);
        if (selectedDay !== "all") params.set("day", selectedDay);
        params.set("sortBy", sortBy);
        params.set("page", String(pageToFetch));
        params.set("limit", "20");

        const res = await fetch(`/api/trains?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setTrains(data.trains || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setCurrentPage(data.page || pageToFetch);
          setIsPastDateWarning(Boolean(data.isPastDate));
          if (data.facets) {
            setFacets(data.facets);
          }
        } else {
          setTrains([]);
          setTotal(0);
          setTotalPages(1);
          setSearchError(data.message || "Failed to retrieve train schedule.");
        }
      } catch (err) {
        console.error("Failed to load trains:", err);
        setTrains([]);
        setSearchError("Network error while connecting to the train database.");
      } finally {
        setIsLoading(false);
      }
    },
    [
      fromParam,
      toParam,
      dateParam,
      selectedCategory,
      selectedClass,
      selectedDepTime,
      selectedArrTime,
      selectedDuration,
      selectedDay,
      sortBy,
    ]
  );

  // Fetch when search criteria, filters, or sorting changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTrains(1);
  }, [fetchTrains]);

  // Handle in-page search form submit
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormValidationError(null);

    const fromTrimmed = fromStation.trim();
    const toTrimmed = toStation.trim();

    if (fromTrimmed && toTrimmed && fromTrimmed.toLowerCase() === toTrimmed.toLowerCase()) {
      setFormValidationError("Source and destination stations cannot be identical.");
      return;
    }

    const todayIST = getTodayIST();
    if (journeyDate && journeyDate < todayIST) {
      setFormValidationError("Journey date cannot be in the past relative to Indian Standard Time (IST).");
      return;
    }

    const params = new URLSearchParams();
    if (fromTrimmed) params.set("from", fromTrimmed);
    if (toTrimmed) params.set("to", toTrimmed);
    if (journeyDate) params.set("date", journeyDate);
    if (passengers) params.set("passengers", passengers);

    router.push(`/trains?${params.toString()}`);
  }

  // Swap From and To stations
  function swapStations() {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
    setFormValidationError(null);
  }

  // Clear/Reset all filters
  function resetAllFilters() {
    setSelectedCategory("all");
    setSelectedDepTime("all");
    setSelectedArrTime("all");
    setSelectedDuration("all");
    setSelectedClass("all");
    setSelectedDay("all");
    setShowAvailableOnly(false);
    setSortBy("departure-asc");
  }

  // Count active non-default filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (selectedDepTime !== "all") count++;
    if (selectedArrTime !== "all") count++;
    if (selectedDuration !== "all") count++;
    if (selectedClass !== "all") count++;
    if (selectedDay !== "all") count++;
    if (showAvailableOnly) count++;
    return count;
  }, [
    selectedCategory,
    selectedDepTime,
    selectedArrTime,
    selectedDuration,
    selectedClass,
    selectedDay,
    showAvailableOnly,
  ]);

  // Client-side availability filter (if toggled)
  const displayedTrains = useMemo(() => {
    if (!showAvailableOnly) return trains;
    return trains.filter((t) => t.availableSeats >= passengersCount);
  }, [trains, showAvailableOnly, passengersCount]);

  // Booking action handler
  async function bookTrain(train: Train | RouteModalTrain) {
    const params = new URLSearchParams({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      from: train.source,
      to: train.destination,
      date: dateParam || journeyDate || getTodayIST(),
      passengers: String(passengersCount),
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
    <main className="min-w-0 flex-1 bg-[#f7f8fc] pb-16 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* HERO BANNER & IN-PAGE ADVANCED SEARCH BAR */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 px-4 py-10 text-white shadow-xl sm:px-8 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                <TrainFront size={16} />
                All-India Railway Network
              </p>
              <h1 className="mt-2 text-2xl font-black sm:text-4xl">
                Advanced Train Search
              </h1>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <Link
                href="/stations"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                <MapPin size={14} />
                Browse 9,000+ Stations
              </Link>
            </div>
          </div>

          {/* EDITABLE ADVANCED SEARCH FORM */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-6 rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md sm:p-6"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_44px_1fr_170px_140px_130px] lg:items-end">
              {/* FROM STATION */}
              <div className="min-w-0 text-slate-900">
                <StationCombobox
                  id="search-from"
                  label="From Station"
                  value={fromStation}
                  onChange={(val) => {
                    setFromStation(val);
                    setFormValidationError(null);
                  }}
                  placeholder="Departure station or code"
                  excludeCode={toStation}
                />
              </div>

              {/* SWAP BUTTON */}
              <div className="flex items-center justify-center lg:mb-1">
                <button
                  type="button"
                  onClick={swapStations}
                  title="Swap departure and destination stations"
                  aria-label="Swap departure and destination stations"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-white shadow-sm transition duration-300 hover:rotate-180 hover:bg-white hover:text-blue-900"
                >
                  <ArrowLeftRight size={18} />
                </button>
              </div>

              {/* TO STATION */}
              <div className="min-w-0 text-slate-900">
                <StationCombobox
                  id="search-to"
                  label="To Station"
                  value={toStation}
                  onChange={(val) => {
                    setToStation(val);
                    setFormValidationError(null);
                  }}
                  placeholder="Destination station or code"
                  excludeCode={fromStation}
                />
              </div>

              {/* JOURNEY DATE */}
              <div className="min-w-0">
                <label
                  htmlFor="search-date"
                  className="mb-1.5 block text-xs font-bold text-blue-100"
                >
                  Travel Date
                </label>
                <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-white px-3 text-slate-900 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                  <CalendarDays size={16} className="mr-2 shrink-0 text-slate-400" />
                  <input
                    id="search-date"
                    type="date"
                    min={getTodayIST()}
                    value={journeyDate}
                    onChange={(e) => {
                      setJourneyDate(e.target.value);
                      setFormValidationError(null);
                    }}
                    className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* PASSENGERS */}
              <div className="min-w-0">
                <label
                  htmlFor="search-passengers"
                  className="mb-1.5 block text-xs font-bold text-blue-100"
                >
                  Passengers
                </label>
                <div className="relative flex h-[46px] items-center rounded-xl border border-slate-200 bg-white px-3 text-slate-900 shadow-sm">
                  <Users size={16} className="mr-2 shrink-0 text-blue-600" />
                  <select
                    id="search-passengers"
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    className="w-full appearance-none bg-transparent text-xs font-bold text-slate-900 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <option key={count} value={count}>
                        {count} Passenger{count > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 text-slate-400" />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div>
                <button
                  type="submit"
                  className="inline-flex h-[46px] w-full items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-4 text-xs font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
                >
                  <Search size={15} />
                  Search Trains
                </button>
              </div>
            </div>

            {/* VALIDATION BANNER */}
            {formValidationError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2.5 text-xs font-bold text-red-200 backdrop-blur">
                <CircleAlert size={15} className="shrink-0 text-red-300" />
                <span>{formValidationError}</span>
              </div>
            )}
          </form>

          {/* ACTIVE ROUTE SUMMARY CHIPS */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-blue-100">
            <span className="font-bold text-white">{fromParam || "All Stations"}</span>
            <ArrowRight size={14} />
            <span className="font-bold text-white">{toParam || "All Destinations"}</span>
            {dateParam && (
              <>
                <span className="text-blue-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={13} />
                  {dateParam}
                </span>
              </>
            )}
            <span className="text-blue-300">•</span>
            <span className="inline-flex items-center gap-1">
              <Users size={13} />
              {passengersCount} Passenger{passengersCount > 1 ? "s" : ""}
            </span>
            <span className="text-blue-300">•</span>
            <span className="rounded-md bg-blue-900/60 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-200">
              {total} Trains Found
            </span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA: FILTER SIDEBAR & RESULTS FEED */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* PAST DATE WARNING */}
        {isPastDateWarning && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <CircleAlert size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">Past Journey Date Warning:</p>
              <p>
                The selected date ({dateParam}) has already passed relative to Indian Standard Time (IST).
                Trains shown reflect the regular schedule for this day of the week. Please select a current or future travel date to complete a reservation.
              </p>
            </div>
          </div>
        )}

        {/* DEMO DATA DISCLAIMER BANNER */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200 sm:p-4">
          <div className="flex items-center gap-2.5">
            <Info size={17} className="shrink-0 text-blue-700 dark:text-blue-400" />
            <span>
              <strong>EDUCATIONAL DEMO DATA:</strong> All 5,200+ passenger train routes and schedules are part of RailConnect&apos;s demonstration database. Not an official CRIS / IRCTC production feed.
            </span>
          </div>
          <span className="hidden shrink-0 rounded bg-blue-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-800 dark:bg-blue-900 dark:text-blue-200 sm:inline-block">
            Simulation
          </span>
        </div>

        {/* CONTROLS HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 lg:hidden"
            >
              <Filter size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-black text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing <strong>{displayedTrains.length}</strong> of <strong>{total}</strong> train services
            </span>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-red-300 hover:text-red-600 dark:border-slate-800 dark:hover:text-red-400"
              >
                <X size={12} />
                Reset filters
              </button>
            )}
          </div>

          {/* SORTING CONTROLS */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              Available Seats Only
            </label>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <SlidersHorizontal size={14} className="text-slate-400" />
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none dark:text-white"
              >
                <option value="departure-asc">Departure: Earliest First</option>
                <option value="departure-desc">Departure: Latest First</option>
                <option value="arrival-asc">Arrival: Earliest First</option>
                <option value="arrival-desc">Arrival: Latest First</option>
                <option value="duration-asc">Shortest Duration</option>
                <option value="fare-asc">Fare: Low to High</option>
                <option value="fare-desc">Fare: High to Low</option>
                <option value="number">Train Number</option>
                <option value="name">Train Name (A–Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT: SIDEBAR (DESKTOP) + TRAIN CARDS */}
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* DESKTOP FILTER SIDEBAR */}
          <aside className="hidden space-y-6 lg:block">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  <Filter size={14} className="text-blue-600 dark:text-blue-400" />
                  Filter Trains
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* FILTER: DEPARTURE TIME WINDOW */}
              <div className="mt-5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Departure Time
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { id: "morning", label: "Morning", sub: "06:00 – 11:59" },
                    { id: "afternoon", label: "Afternoon", sub: "12:00 – 17:59" },
                    { id: "evening", label: "Evening", sub: "18:00 – 23:59" },
                    { id: "night", label: "Night", sub: "00:00 – 05:59" },
                  ].map((slot) => {
                    const isSelected = selectedDepTime === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedDepTime(isSelected ? "all" : slot.id)}
                        className={`rounded-xl border p-2 text-left transition ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-200"
                            : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400"
                        }`}
                      >
                        <span className="block text-xs font-bold">{slot.label}</span>
                        <span className="block text-[10px] text-slate-400">{slot.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* FILTER: ARRIVAL TIME WINDOW */}
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Arrival Time
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { id: "morning", label: "Morning", sub: "06:00 – 11:59" },
                    { id: "afternoon", label: "Afternoon", sub: "12:00 – 17:59" },
                    { id: "evening", label: "Evening", sub: "18:00 – 23:59" },
                    { id: "night", label: "Night", sub: "00:00 – 05:59" },
                  ].map((slot) => {
                    const isSelected = selectedArrTime === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedArrTime(isSelected ? "all" : slot.id)}
                        className={`rounded-xl border p-2 text-left transition ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-200"
                            : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400"
                        }`}
                      >
                        <span className="block text-xs font-bold">{slot.label}</span>
                        <span className="block text-[10px] text-slate-400">{slot.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* FILTER: JOURNEY DURATION */}
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Travel Duration
                </label>
                <div className="mt-2 space-y-1.5">
                  {[
                    { id: "fast", label: "Fast (Under 6 hours)" },
                    { id: "medium", label: "Standard (6 to 12 hours)" },
                    { id: "long", label: "Long Distance (12 to 24 hours)" },
                    { id: "overnight", label: "Extended / Multi-day (> 24 hours)" },
                  ].map((dur) => (
                    <label
                      key={dur.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <input
                        type="radio"
                        name="duration"
                        checked={selectedDuration === dur.id}
                        onChange={() => setSelectedDuration(dur.id)}
                        className="accent-blue-600"
                      />
                      <span>{dur.label}</span>
                    </label>
                  ))}
                  {selectedDuration !== "all" && (
                    <button
                      type="button"
                      onClick={() => setSelectedDuration("all")}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Clear duration filter
                    </button>
                  )}
                </div>
              </div>

              {/* FILTER: TRAVEL CLASSES */}
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Travel Class
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {facets.coachClasses.length > 0 ? (
                    facets.coachClasses.map((cls) => {
                      const isSelected = selectedClass === cls;
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setSelectedClass(isSelected ? "all" : cls)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })
                  ) : (
                    ["1A", "2A", "3A", "CC", "EC", "SL", "2S"].map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setSelectedClass(selectedClass === cls ? "all" : cls)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          selectedClass === cls
                            ? "bg-blue-600 text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {cls}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* FILTER: TRAIN CATEGORY */}
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Train Category
                </label>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === "all"}
                      onChange={() => setSelectedCategory("all")}
                      className="accent-blue-600"
                    />
                    <span>All Categories</span>
                  </label>
                  {facets.categories.map((cat) => (
                    <label
                      key={cat}
                      className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                        className="accent-blue-600"
                      />
                      <span className="truncate">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* FILTER: RUNNING DAY */}
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Operates On
                </label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(isSelected ? "all" : day)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT: RESULTS FEED */}
          <div className="space-y-5">
            {/* ERROR BANNER */}
            {searchError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <div className="flex items-center gap-2 font-bold">
                  <CircleAlert size={18} />
                  <span>Search Error</span>
                </div>
                <p className="mt-1 text-xs">{searchError}</p>
                <button
                  type="button"
                  onClick={() => fetchTrains(1)}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                >
                  <RefreshCw size={13} />
                  Retry Query
                </button>
              </div>
            )}

            {/* SKELETON LOADING STATE */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-44 animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  />
                ))}
              </div>
            ) : displayedTrains.length > 0 ? (
              /* TRAIN RESULT CARDS */
              <div className="space-y-5">
                {displayedTrains.map((train) => (
                  <article
                    key={train.trainNumber}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:p-7"
                  >
                    {/* TOP: TRAIN HEADER & TIMELINE */}
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">
                            {train.trainName}
                          </h2>
                          <span className="rounded-lg bg-blue-100 px-2.5 py-1 font-mono text-xs font-black text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                            #{train.trainNumber}
                          </span>
                          {train.category && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                              <Sparkles size={12} />
                              {train.category}
                            </span>
                          )}
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            DEMO
                          </span>
                        </div>

                        {/* ROUTE ENDPOINTS & STOPS INFO */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin size={14} className="text-blue-600 dark:text-blue-400" />
                          <span>
                            <strong>{train.source}</strong> ({train.sourceCode})
                          </span>
                          <span>→</span>
                          <span>
                            <strong>{train.destination}</strong> ({train.destinationCode})
                          </span>
                          <span>•</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {train.intermediateStopsCount} Stops
                          </span>
                        </div>

                        {/* RUNNING DAYS */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                          <span>Runs:</span>
                          {train.scheduleUnknown ? (
                            <span className="italic text-amber-600 dark:text-amber-400">
                              Schedule unknown / Verify
                            </span>
                          ) : train.runsOn && train.runsOn.length === 7 ? (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              Daily Service (All 7 Days)
                            </span>
                          ) : train.runsOn && train.runsOn.length > 0 ? (
                            <div className="flex gap-1 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {train.runsOn.join(", ")}
                            </div>
                          ) : (
                            <span className="italic">Not specified</span>
                          )}
                        </div>
                      </div>

                      {/* TIMELINE SCHEMATIC */}
                      <div className="grid grid-cols-3 items-center gap-3 rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-800/40 sm:gap-6 lg:min-w-96">
                        <div>
                          <p className="font-mono text-xl font-black text-slate-900 dark:text-white">
                            {train.departure}
                          </p>
                          <p className="mt-0.5 max-w-28 truncate text-xs font-bold text-slate-600 dark:text-slate-300">
                            {train.source}
                          </p>
                          <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            {train.sourceCode}
                          </span>
                        </div>

                        <div className="text-center">
                          <p className="flex items-center justify-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <Clock size={12} />
                            {train.duration}
                          </p>
                          <div className="my-1.5 flex items-center">
                            <div className="h-0.5 flex-1 bg-slate-300 dark:bg-slate-700" />
                            <ArrowRight size={15} className="mx-1 shrink-0 text-blue-600 dark:text-blue-400" />
                            <div className="h-0.5 flex-1 bg-slate-300 dark:bg-slate-700" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {train.intermediateStopsCount > 0
                              ? `${train.intermediateStopsCount} Stops`
                              : "Non-stop"}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 font-mono text-xl font-black text-slate-900 dark:text-white">
                            <span>{train.arrival}</span>
                            {train.dayOffset > 0 && (
                              <span className="rounded bg-indigo-100 px-1 py-0.2 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                +{train.dayOffset}D
                              </span>
                            )}
                          </div>
                          <p className="ml-auto mt-0.5 max-w-28 truncate text-xs font-bold text-slate-600 dark:text-slate-300">
                            {train.destination}
                          </p>
                          <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            {train.destinationCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM: PRICING, COACHES & ACTIONS */}
                    <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center">
                      <div className="flex flex-wrap items-center gap-5 sm:gap-6">
                        {/* FARE */}
                        <div>
                          <p className="flex items-center gap-1 text-xs text-slate-400">
                            <IndianRupee size={12} />
                            Base Fare / Passenger
                          </p>
                          <p className="mt-0.5 text-2xl font-black text-blue-800 dark:text-blue-400">
                            ₹{train.fare.toLocaleString("en-IN")}
                          </p>
                        </div>

                        {/* SEATS */}
                        <div>
                          <p className="flex items-center gap-1 text-xs text-slate-400">
                            <Ticket size={13} />
                            Available Demo Seats
                          </p>
                          <p
                            className={`mt-0.5 font-bold ${
                              train.availableSeats >= passengersCount
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-500"
                            }`}
                          >
                            {train.availableSeats} of {train.totalSeats} seats
                          </p>
                        </div>

                        {/* COACH CLASSES */}
                        {train.coachTypes && train.coachTypes.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400">Classes</p>
                            <div className="mt-1 flex gap-1">
                              {train.coachTypes.map((c) => (
                                <span
                                  key={c}
                                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRouteTrain(train)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Compass size={15} />
                          View Route
                        </button>

                        <button
                          type="button"
                          disabled={train.availableSeats < passengersCount}
                          onClick={() => bookTrain(train)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-6 py-3 text-xs font-black text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-800"
                        >
                          {train.availableSeats >= passengersCount ? "Book Journey" : "Sold Out"}
                          {train.availableSeats >= passengersCount && <ArrowRight size={16} />}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                {/* PAGINATION BAR */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({total} trains total)
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fetchTrains(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoading}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      >
                        <ChevronLeft size={15} /> Previous
                      </button>

                      <button
                        type="button"
                        onClick={() => fetchTrains(currentPage + 1)}
                        disabled={currentPage >= totalPages || isLoading}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      >
                        Next <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* EMPTY STATE */
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Search size={32} />
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  No Direct Trains Found
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                  {fromParam && toParam
                    ? `No demo trains currently run from ${fromParam} to ${toParam}${
                        dateParam ? ` on ${dateParam}` : ""
                      }. Try resetting active filters, swapping departure/arrival, or checking alternate dates.`
                    : "No trains match your specified filter criteria. Try clearing filters or exploring alternative stations."}
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-800"
                    >
                      Clear All Filters
                    </button>
                  )}

                  <Link
                    href="/trains"
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                  >
                    View All 5,200 Trains
                  </Link>

                  <Link
                    href="/stations"
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Browse Stations Directory
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ROUTE DETAILS MODAL */}
      {selectedRouteTrain && (
        <RouteDetailsModal
          train={selectedRouteTrain}
          onClose={() => setSelectedRouteTrain(null)}
          onBook={bookTrain}
        />
      )}

      {/* MOBILE FILTER SLIDE-OVER DRAWER */}
      {isMobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm lg:hidden"
        >
          <div className="flex h-full w-full max-w-xs flex-col bg-white p-6 shadow-2xl dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                <Filter size={16} className="text-blue-600" />
                Filter Trains
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6 text-xs">
              {/* Category */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {facets.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Departure Time */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">Departure Time</label>
                <select
                  value={selectedDepTime}
                  onChange={(e) => setSelectedDepTime(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="all">Any Departure Time</option>
                  <option value="morning">Morning (06:00 – 11:59)</option>
                  <option value="afternoon">Afternoon (12:00 – 17:59)</option>
                  <option value="evening">Evening (18:00 – 23:59)</option>
                  <option value="night">Night (00:00 – 05:59)</option>
                </select>
              </div>

              {/* Arrival Time */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">Arrival Time</label>
                <select
                  value={selectedArrTime}
                  onChange={(e) => setSelectedArrTime(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="all">Any Arrival Time</option>
                  <option value="morning">Morning (06:00 – 11:59)</option>
                  <option value="afternoon">Afternoon (12:00 – 17:59)</option>
                  <option value="evening">Evening (18:00 – 23:59)</option>
                  <option value="night">Night (00:00 – 05:59)</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">Duration</label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="all">Any Duration</option>
                  <option value="fast">Fast (Under 6 hours)</option>
                  <option value="medium">Standard (6 to 12 hours)</option>
                  <option value="long">Long Distance (12 to 24 hours)</option>
                  <option value="overnight">Extended / Multi-day (&gt; 24h)</option>
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">Travel Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="all">Any Coach Class</option>
                  {facets.coachClasses.map((cl) => (
                    <option key={cl} value={cl}>
                      {cl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 rounded-xl bg-blue-700 p-2.5 text-xs font-bold text-white"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TrainsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] dark:bg-slate-950">
          <Loader2 className="animate-spin text-blue-600" size={36} />
        </div>
      }
    >
      <TrainsContent />
    </Suspense>
  );
}
