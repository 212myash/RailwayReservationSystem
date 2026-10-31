"use client";

import { useEffect, useRef } from "react";
import {
  CalendarDays,
  Clock,
  Compass,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";

export type RouteStop = {
  sequence: number;
  stationCode: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
  haltMinutes: number;
  dayCount: number;
  isBoarding?: boolean;
  isDebarking?: boolean;
  isInSegment?: boolean;
};

export type RouteModalTrain = {
  trainNumber: string;
  trainName: string;
  category?: string;
  source: string;
  sourceCode?: string;
  destination: string;
  destinationCode?: string;
  departure: string;
  arrival: string;
  duration: string;
  fare: number;
  runsOn?: string[];
  totalRouteStops?: number;
  stops?: RouteStop[];
};

type RouteDetailsModalProps = {
  train: RouteModalTrain;
  onClose: () => void;
  onBook?: (train: RouteModalTrain) => void;
};

export default function RouteDetailsModal({
  train,
  onClose,
  onBook,
}: RouteDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const stops = train.stops || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
          <div className="pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-blue-100 px-2.5 py-1 font-mono text-xs font-black text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                #{train.trainNumber}
              </span>
              {train.category && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  <Sparkles size={12} />
                  {train.category}
                </span>
              )}
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                DEMO ROUTE
              </span>
            </div>

            <h2
              id="route-modal-title"
              className="mt-2 text-lg font-black text-slate-900 dark:text-white sm:text-xl"
            >
              {train.trainName}
            </h2>

            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Compass size={13} className="text-blue-600 dark:text-blue-400" />
              <span>
                {train.source} → {train.destination}
              </span>
              <span>•</span>
              <Clock size={13} />
              <span>{train.duration}</span>
              <span>•</span>
              <span>{stops.length} Total Route Stops</span>
            </p>

            {train.runsOn && train.runsOn.length > 0 && (
              <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <CalendarDays size={12} />
                <span>Runs On:</span>
                <strong className="text-slate-700 dark:text-slate-300">
                  {train.runsOn.join(", ")}
                </strong>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close route details"
            className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* LEGEND BAR */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-2.5 text-[11px] font-bold text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400">
          <span className="text-slate-400">Route Highlights:</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            Your Boarding Station
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            Your Destination Station
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Intermediate Stops
          </span>
        </div>

        {/* TIMELINE LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {stops.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No stop information available for this train.
            </div>
          ) : (
            <div className="relative space-y-3">
              {stops.map((stop, index) => {
                const isFirst = index === 0;
                const isLast = index === stops.length - 1;
                const isBoarding = stop.isBoarding;
                const isDebarking = stop.isDebarking;
                const isInSegment = stop.isInSegment;

                return (
                  <div
                    key={`${stop.stationCode}-${index}`}
                    className={`relative flex items-center justify-between rounded-2xl border p-3.5 transition sm:p-4 ${
                      isBoarding
                        ? "border-emerald-300 bg-emerald-50/70 shadow-sm dark:border-emerald-700/60 dark:bg-emerald-950/30"
                        : isDebarking
                        ? "border-blue-300 bg-blue-50/70 shadow-sm dark:border-blue-700/60 dark:bg-blue-950/30"
                        : isInSegment
                        ? "border-blue-100 bg-blue-50/20 dark:border-blue-900/40 dark:bg-slate-900/40"
                        : "border-slate-100 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/20"
                    }`}
                  >
                    {/* LEFT: SEQUENCE & STATION DETAILS */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black sm:h-9 sm:w-9 ${
                          isBoarding
                            ? "bg-emerald-600 text-white"
                            : isDebarking
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {stop.sequence}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white sm:text-sm">
                            {stop.stationName}
                          </span>
                          <span className="rounded bg-slate-200/80 px-1.5 py-0.2 font-mono text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {stop.stationCode}
                          </span>
                          {isBoarding && (
                            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                              Boarding
                            </span>
                          )}
                          {isDebarking && (
                            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                              Destination
                            </span>
                          )}
                          {isFirst && !isBoarding && (
                            <span className="rounded bg-slate-300 px-1.5 py-0.2 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              Origin
                            </span>
                          )}
                          {isLast && !isDebarking && (
                            <span className="rounded bg-slate-300 px-1.5 py-0.2 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              Terminal
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 sm:text-xs">
                          <span>Day {stop.dayCount}</span>
                          {stop.haltMinutes > 0 && !isFirst && !isLast && (
                            <>
                              <span>•</span>
                              <span>Halt: {stop.haltMinutes}m</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: TIMINGS */}
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2 font-mono text-xs sm:text-sm">
                        <div className="text-right">
                          <span className="block text-[10px] uppercase font-bold text-slate-400">
                            Arr
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {isFirst ? "Starts" : stop.arrivalTime || "--:--"}
                          </span>
                        </div>

                        <span className="text-slate-300 dark:text-slate-700">|</span>

                        <div className="text-left">
                          <span className="block text-[10px] uppercase font-bold text-slate-400">
                            Dep
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {isLast ? "Ends" : stop.departureTime || "--:--"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close Route View
          </button>

          {onBook && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onBook(train);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800"
            >
              <Ticket size={15} />
              Book This Journey (₹{train.fare.toLocaleString("en-IN")})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
