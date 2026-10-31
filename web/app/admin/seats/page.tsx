"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Info,
  RefreshCw,
} from "lucide-react";

type BerthData = {
  number: number;
  seatKey: string;
  type: string;
  status: "available" | "booked";
  bookingReference: string | null;
  passengerName: string | null;
};

type SeatAvailabilityResponse = {
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  totalBerths: number;
  bookedCount: number;
  availableCount: number;
  occupancyRate: number;
  berths: BerthData[];
};

type TrainOption = {
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
};

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

export default function AdminSeatsPage() {
  const [trainList, setTrainList] = useState<TrainOption[]>([]);
  const [selectedTrain, setSelectedTrain] = useState("12002");
  const [selectedDate, setSelectedDate] = useState(getTodayInIndia());
  const [seatData, setSeatData] = useState<SeatAvailabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBerth, setSelectedBerth] = useState<BerthData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Load train list for the selector
  useEffect(() => {
    async function loadTrainOptions() {
      try {
        const res = await fetch("/api/admin/trains", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data.success && data.trains?.length) {
          setTrainList(data.trains);
          setSelectedTrain(data.trains[0].trainNumber);
        }
      } catch {
        // ignore
      }
    }
    void loadTrainOptions();
  }, []);

  const loadSeatMatrix = useCallback(async (trainNum: string, dateStr: string) => {
    setIsLoading(true);
    setErrorMessage("");
    setSelectedBerth(null);
    try {
      const res = await fetch(
        `/api/admin/seats?trainNumber=${encodeURIComponent(trainNum)}&journeyDate=${encodeURIComponent(dateStr)}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setSeatData(data);
      } else {
        setErrorMessage(data.message || "Could not retrieve seat data.");
      }
    } catch {
      setErrorMessage("Network error fetching seat matrix.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTrain && selectedDate) {
      const timer = setTimeout(() => {
        void loadSeatMatrix(selectedTrain, selectedDate);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedTrain, selectedDate, loadSeatMatrix]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Demo Seat Matrix</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Inspect live coach berth occupancy generated from confirmed database bookings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadSeatMatrix(selectedTrain, selectedDate)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh Matrix
        </button>
      </div>

      {/* FILTER & SELECTOR CONTROLS */}
      <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Train Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-400">Select Train</label>
          <select
            value={selectedTrain}
            onChange={(e) => setSelectedTrain(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs font-bold text-white focus:border-blue-500 focus:outline-none"
          >
            {trainList.map((t) => (
              <option key={t.trainNumber} value={t.trainNumber}>
                {t.trainNumber} — {t.trainName} ({t.source} → {t.destination})
              </option>
            ))}
          </select>
        </div>

        {/* Journey Date */}
        <div>
          <label className="block text-xs font-bold text-slate-400">Journey Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs font-bold text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <div className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-xs">
            <span className="font-semibold text-slate-400">Occupancy:</span>
            <span className="font-mono font-bold text-white">
              {isLoading ? "..." : `${seatData?.occupancyRate ?? 0}%`}
            </span>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-300">
          {errorMessage}
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
          <span className="block text-[11px] font-bold text-slate-400">Total Berths</span>
          <span className="mt-1 block text-2xl font-black text-white sm:text-3xl">
            {isLoading ? "..." : seatData?.totalBerths ?? 72}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
          <span className="block text-[11px] font-bold text-emerald-400">Available</span>
          <span className="mt-1 block text-2xl font-black text-emerald-400 sm:text-3xl">
            {isLoading ? "..." : seatData?.availableCount ?? 0}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
          <span className="block text-[11px] font-bold text-red-400">Booked</span>
          <span className="mt-1 block text-2xl font-black text-red-400 sm:text-3xl">
            {isLoading ? "..." : seatData?.bookedCount ?? 0}
          </span>
        </div>
      </div>

      {/* SELECTED BERTH DETAIL POPUP / BANNER */}
      {selectedBerth && (
        <div className="flex items-center justify-between rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-200">
          <div>
            <span className="font-bold text-white">
              Berth #{selectedBerth.number} ({selectedBerth.type}):
            </span>{" "}
            {selectedBerth.status === "booked" ? (
              <span>
                Reserved by <strong className="text-white">{selectedBerth.passengerName}</strong> —{" "}
                PNR Reference:{" "}
                <span className="font-mono font-bold text-blue-300">{selectedBerth.bookingReference}</span>
              </span>
            ) : (
              <span className="text-emerald-300">Available for reservation</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelectedBerth(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* COACH MAP GRID (72 BERTHS) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-xs sm:text-sm">
              Standard Coach Layout (72 Berths)
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
              Coach B1
            </span>
          </div>

          {/* LEGEND */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-500/80 ring-1 ring-emerald-400" />
              <span className="text-slate-300">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-red-500/80 ring-1 ring-red-400" />
              <span className="text-slate-300">Confirmed Booked</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-6 gap-2 py-8 sm:grid-cols-8 md:grid-cols-12">
            {Array.from({ length: 72 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-900" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12">
            {seatData?.berths.map((b) => {
              const isSelected = selectedBerth?.number === b.number;
              const isBooked = b.status === "booked";

              return (
                <button
                  type="button"
                  key={b.number}
                  onClick={() => setSelectedBerth(b)}
                  className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition ${
                    isBooked
                      ? "border border-red-500/30 bg-red-500/15 text-red-200 hover:bg-red-500/25"
                      : "border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                  } ${isSelected ? "ring-2 ring-white" : ""}`}
                >
                  <span className="font-mono font-black text-white text-sm">{b.number}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">
                    {b.type}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-start gap-2 text-[11px] text-slate-500">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            Click on any seat to inspect passenger and booking details. Berths 1–72 reflect real-time
            confirmed MongoDB reservations for {seatData?.trainNumber} on {selectedDate}.
          </span>
        </div>
      </div>
    </div>
  );
}
