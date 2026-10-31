"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Armchair,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  RefreshCw,
  ShieldAlert,
  TrainFront,
  Users,
} from "lucide-react";
import CoachLayoutViewer, {
  CoachBerthItem,
} from "@/components/CoachLayoutViewer";
import { CoachClass, COACH_CLASS_NAMES } from "@/lib/coach-templates";

interface Passenger {
  name: string;
  age: string;
  gender: string;
  berthPreference?: string;
  berth?: string;
}

interface CoachOption {
  coachId: string;
  sequence: number;
  layoutTemplateId: string;
  templateName: string;
  totalCapacity: number;
}

interface ClassOption {
  coachClass: CoachClass;
  className: string;
  coaches: CoachOption[];
}

interface SeatMatrixResponse {
  coach: CoachOption;
  template: {
    id: string;
    name: string;
    coachClass: CoachClass;
    totalCapacity: number;
    compartmentCount: number;
  };
  berths: CoachBerthItem[];
  summary: {
    totalCapacity: number;
    availableCount: number;
    lockedCount: number;
    bookedCount: number;
  };
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
  const fare = Number.isFinite(fareParam) && fareParam >= 0 ? fareParam : 0;

  const passengerParam = Number(searchParams.get("passengers") || "1");
  const passengerCount =
    Number.isInteger(passengerParam) &&
    passengerParam >= 1 &&
    passengerParam <= 6
      ? passengerParam
      : 1;

  const passengerDetailsParam = searchParams.get("passengerDetails") || "[]";

  const initialPassengers = useMemo<Passenger[]>(() => {
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

  // Classes & Coaches available on this train
  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<CoachClass>("SL");
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");

  // Live seat matrix for selected coach
  const [matrixData, setMatrixData] = useState<SeatMatrixResponse | null>(null);
  const [selectedBerths, setSelectedBerths] = useState<number[]>([]);

  // Passenger preferences and seat mappings
  const [preferences, setPreferences] = useState<Record<number, string>>({});

  // Loading & Error states
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(true);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const formattedDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not selected";

  const totalFare = fare * passengerCount;

  // 1. Fetch available coach classes for this train
  useEffect(() => {
    let active = true;

    async function loadTrainCoaches() {
      if (!trainNumber) return;
      setIsLoadingCoaches(true);
      setErrorMessage("");

      try {
        const res = await fetch(
          `/api/trains/${encodeURIComponent(trainNumber)}/coaches`
        );
        const data = await res.json();

        if (!active) return;

        if (res.ok && data.success && data.availableClasses?.length > 0) {
          const classes: ClassOption[] = data.availableClasses;
          setAvailableClasses(classes);

          // Default to first class (or SL if present)
          const preferred =
            classes.find((c) => c.coachClass === "SL") || classes[0];
          setSelectedClass(preferred.coachClass);

          if (preferred.coaches.length > 0) {
            setSelectedCoachId(preferred.coaches[0].coachId);
          }
        } else {
          setErrorMessage("Failed to load coaches for this train.");
        }
      } catch {
        if (active) {
          setErrorMessage("Could not connect to server to fetch train coaches.");
        }
      } finally {
        if (active) setIsLoadingCoaches(false);
      }
    }

    void loadTrainCoaches();

    return () => {
      active = false;
    };
  }, [trainNumber]);

  // 2. When coach changes or date changes, load live seat matrix
  useEffect(() => {
    let active = true;

    async function loadSeatMatrix() {
      if (!trainNumber || !selectedCoachId || !date) return;

      setIsLoadingSeats(true);
      setErrorMessage("");

      try {
        const res = await fetch(
          `/api/trains/${encodeURIComponent(
            trainNumber
          )}/seats?journeyDate=${encodeURIComponent(
            date
          )}&coachId=${encodeURIComponent(selectedCoachId)}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (!active) return;

        if (res.ok && data.success && data.matrix) {
          setMatrixData(data.matrix);
          // Preserve any selected berths that are still available
          setSelectedBerths((prev) =>
            prev.filter((num) => {
              const b = data.matrix.berths.find(
                (item: CoachBerthItem) => item.number === num
              );
              return b && (b.status === "available" || b.isLockedByMe);
            })
          );
        } else {
          setErrorMessage(
            data.message || "Unable to fetch live seat availability for coach."
          );
        }
      } catch {
        if (active) {
          setErrorMessage("Failed to reach server for seat availability.");
        }
      } finally {
        if (active) setIsLoadingSeats(false);
      }
    }

    void loadSeatMatrix();

    return () => {
      active = false;
    };
  }, [trainNumber, selectedCoachId, date]);

  // Coaches in the currently selected class
  const activeClassCoaches = useMemo(() => {
    const cls = availableClasses.find((c) => c.coachClass === selectedClass);
    return cls ? cls.coaches : [];
  }, [availableClasses, selectedClass]);

  // Handle class tab switch
  function handleSelectClass(cls: CoachClass) {
    if (cls === selectedClass) return;
    setSelectedClass(cls);
    setSelectedBerths([]); // Reset berth selection on class change

    const matchingClass = availableClasses.find((c) => c.coachClass === cls);
    if (matchingClass && matchingClass.coaches.length > 0) {
      setSelectedCoachId(matchingClass.coaches[0].coachId);
    }
  }

  // Handle berth toggle on coach layout
  function handleToggleBerth(berthNumber: number) {
    setErrorMessage("");

    setSelectedBerths((current) => {
      if (current.includes(berthNumber)) {
        return current.filter((num) => num !== berthNumber);
      }

      if (current.length >= passengerCount) {
        setErrorMessage(
          `All ${passengerCount} berth${
            passengerCount > 1 ? "s" : ""
          } selected. Click an existing selection to change it.`
        );
        return current;
      }

      return [...current, berthNumber].sort((a, b) => a - b);
    });
  }

  // Preference options according to selected class
  const preferenceOptions = useMemo(() => {
    switch (selectedClass) {
      case "1A":
        return [
          { value: "No preference", label: "No preference" },
          { value: "Lower Berth", label: "Cabin Lower Berth" },
          { value: "Upper Berth", label: "Cabin Upper Berth" },
          { value: "Cabin Preference", label: "4-Berth Cabin Preference" },
          { value: "Coupe Preference", label: "2-Berth Coupe Preference" },
        ];
      case "2A":
        return [
          { value: "No preference", label: "No preference" },
          { value: "Lower Berth", label: "Lower Berth (LB)" },
          { value: "Upper Berth", label: "Upper Berth (UB)" },
          { value: "Side Lower", label: "Side Lower (SL)" },
          { value: "Side Upper", label: "Side Upper (SU)" },
        ];
      case "CC":
        return [
          { value: "No preference", label: "No preference" },
          { value: "Window", label: "Window Seat" },
          { value: "Aisle", label: "Aisle Seat" },
        ];
      case "2S":
        return [
          { value: "No preference", label: "No preference" },
          { value: "Window", label: "Window Seat" },
          { value: "Middle", label: "Middle Seat" },
          { value: "Aisle", label: "Aisle Seat" },
        ];
      case "SL":
      case "3A":
      default:
        return [
          { value: "No preference", label: "No preference" },
          { value: "Lower Berth", label: "Lower Berth (LB)" },
          { value: "Middle Berth", label: "Middle Berth (MB)" },
          { value: "Upper Berth", label: "Upper Berth (UB)" },
          { value: "Side Lower", label: "Side Lower (SL)" },
          { value: "Side Upper", label: "Side Upper (SU)" },
        ];
    }
  }, [selectedClass]);

  // Handle Proceed to Review with Atomic Seat Locking
  async function handleContinue() {
    setErrorMessage("");

    if (!trainNumber || !trainName || !from || !to || !date) {
      setErrorMessage(
        "Train or journey details are missing. Please re-select your train."
      );
      return;
    }

    if (selectedBerths.length !== passengerCount) {
      setErrorMessage(
        `Please select exactly ${passengerCount} berth${
          passengerCount > 1 ? "s" : ""
        } on the layout before continuing.`
      );
      return;
    }

    if (initialPassengers.length !== passengerCount) {
      setErrorMessage(
        "Passenger details could not be verified. Please return to the previous step."
      );
      return;
    }

    if (!matrixData) {
      setErrorMessage("Coach layout data is unavailable. Please try again.");
      return;
    }

    setIsLocking(true);

    try {
      // Build berth specifications for locking
      const seatsToLock = selectedBerths.map((seatNum) => {
        const berthDef = matrixData.berths.find((b) => b.number === seatNum);
        return {
          seatNumber: seatNum,
          berthType: berthDef?.type || "LB",
        };
      });

      // Call Atomic Seat Locking API (10-minute hold)
      const lockRes = await fetch(
        `/api/trains/${encodeURIComponent(trainNumber)}/seats/lock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            journeyDate: date,
            coachId: selectedCoachId,
            coachClass: selectedClass,
            seats: seatsToLock,
          }),
        }
      );

      const lockData = await lockRes.json();

      if (!lockRes.ok || !lockData.success) {
        setErrorMessage(
          lockData.message ||
            "One or more of your selected berths was just booked by another user. Please select other berths."
        );
        // Refresh seat matrix to reflect latest inventory
        const refreshRes = await fetch(
          `/api/trains/${encodeURIComponent(
            trainNumber
          )}/seats?journeyDate=${encodeURIComponent(
            date
          )}&coachId=${encodeURIComponent(selectedCoachId)}`,
          { cache: "no-store" }
        );
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.success) {
          setMatrixData(refreshData.matrix);
        }
        setIsLocking(false);
        return;
      }

      // Prepare updated passengers with assigned berths and preferences
      const updatedPassengers = initialPassengers.map((p, idx) => {
        const assignedSeatNum = selectedBerths[idx];
        const berthDef = matrixData.berths.find(
          (b) => b.number === assignedSeatNum
        );
        const berthLabel = berthDef ? `${assignedSeatNum} (${berthDef.label})` : `Seat ${assignedSeatNum}`;

        return {
          ...p,
          berth: berthLabel,
          berthPreference: preferences[idx] || "No preference",
        };
      });

      const berthDetails = selectedBerths.map((seatNum) => {
        const berthDef = matrixData.berths.find((b) => b.number === seatNum);
        return {
          number: seatNum,
          type: berthDef?.type || "LB",
          label: berthDef?.label || "Berth",
        };
      });

      const seatsFormatted = selectedBerths
        .map((num) => {
          const b = matrixData.berths.find((item) => item.number === num);
          return `${num} (${b?.type || "BERTH"})`;
        })
        .join(",");

      const params = new URLSearchParams({
        trainNumber,
        trainName,
        from,
        to,
        date,
        passengers: String(passengerCount),
        fare: String(fare),
        coach: selectedCoachId,
        coachClass: selectedClass,
        layoutTemplateId: matrixData.template.id,
        seats: seatsFormatted,
        berthDetails: JSON.stringify(berthDetails),
        passengerDetails: JSON.stringify(updatedPassengers),
      });

      router.push(`/booking/review?${params.toString()}`);
    } catch {
      setErrorMessage(
        "An unexpected error occurred while locking seats. Please try again."
      );
    } finally {
      setIsLocking(false);
    }
  }

  return (
    <main className="min-w-0 flex-1 bg-[#f7f8fc] pb-16 text-slate-900">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-700 px-5 py-10 text-white sm:px-8 sm:py-12">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
            <Armchair size={16} />
            Step 2 of 3 — Dynamic Seating Selection
          </p>

          <h1 className="mt-2 text-2xl font-black sm:text-4xl">
            Choose Your Coach & Berths
          </h1>

          <p className="mt-2 max-w-xl text-xs sm:text-sm text-blue-100">
            Select your travel class, pick an available coach, and click your
            preferred berths on the realistic compartment layout.
          </p>

          {/* Journey Context Card */}
          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <TrainFront size={16} className="text-blue-300" />
              <span className="font-bold">{trainName}</span>
              <span className="font-mono text-blue-200">({trainNumber})</span>
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-300" />
              <span>
                {from} → {to}
              </span>
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-300" />
              <span>{formattedDate}</span>
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-300" />
              <span>
                {passengerCount} Passenger{passengerCount > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-medium text-rose-800 shadow-sm">
            <ShieldAlert size={18} className="flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Coach Class & Interactive Layout (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Travel Class Selector Tabs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                1. Select Travel Class
              </h2>

              {isLoadingCoaches ? (
                <div className="flex items-center gap-2 py-4 text-xs font-semibold text-slate-400">
                  <RefreshCw size={14} className="animate-spin text-blue-600" />
                  Loading train coach classes...
                </div>
              ) : availableClasses.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No classes configured for this train.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableClasses.map((cls) => {
                    const isCurrent = cls.coachClass === selectedClass;
                    return (
                      <button
                        key={cls.coachClass}
                        type="button"
                        onClick={() => handleSelectClass(cls.coachClass)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                          isCurrent
                            ? "bg-blue-900 text-white shadow-md shadow-blue-900/20"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50"
                        }`}
                      >
                        <Armchair size={15} />
                        <span>{cls.className}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] ${
                            isCurrent
                              ? "bg-blue-800 text-blue-200"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {cls.coaches.length} coach
                          {cls.coaches.length > 1 ? "es" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Coach Selector Pills */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Choose Coach in {COACH_CLASS_NAMES[selectedClass]}
                </h2>
                {matrixData && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {matrixData.summary.availableCount} of{" "}
                    {matrixData.summary.totalCapacity} berths free
                  </span>
                )}
              </div>

              {activeClassCoaches.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No active coaches found in this class.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {activeClassCoaches.map((c) => {
                    const isSelectedCoach = c.coachId === selectedCoachId;
                    return (
                      <button
                        key={c.coachId}
                        type="button"
                        onClick={() => {
                          setSelectedCoachId(c.coachId);
                          setSelectedBerths([]);
                        }}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                          isSelectedCoach
                            ? "border-2 border-blue-600 bg-blue-50 text-blue-950 font-black shadow-sm"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-mono text-sm">{c.coachId}</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          ({c.totalCapacity} berths)
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seating Layout Canvas */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Coach {selectedCoachId} Seating Layout
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click an available berth to select it for your journey.
                  </p>
                </div>

                {/* Status Color Legend */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded border border-slate-300 bg-white" />
                    <span className="text-slate-600">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded bg-blue-600" />
                    <span className="text-blue-900 font-semibold">
                      Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded bg-amber-100 border border-amber-300" />
                    <span className="text-amber-800">Locked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded bg-slate-200 border border-slate-300" />
                    <span className="text-slate-400">Booked</span>
                  </div>
                </div>
              </div>

              {isLoadingSeats ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <RefreshCw
                    size={28}
                    className="animate-spin text-blue-600 mb-2"
                  />
                  <p className="text-xs font-semibold">
                    Fetching live coach layout and seat inventory...
                  </p>
                </div>
              ) : matrixData ? (
                <CoachLayoutViewer
                  layoutTemplateId={matrixData.template.id}
                  coachId={selectedCoachId}
                  coachClass={selectedClass}
                  berths={matrixData.berths}
                  selectedBerthNumbers={selectedBerths}
                  onToggleBerth={handleToggleBerth}
                  interactive={true}
                />
              ) : (
                <p className="py-12 text-center text-xs text-slate-400">
                  Select a coach above to inspect seating layout.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Passenger Assignments & Booking Summary (4 cols) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Passenger Assignment Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Passengers & Preferences</span>
                <span className="text-xs font-normal text-slate-500">
                  {selectedBerths.length} of {passengerCount} assigned
                </span>
              </h3>

              <div className="space-y-4">
                {initialPassengers.map((passenger, idx) => {
                  const assignedSeatNum = selectedBerths[idx];
                  const assignedBerthDef = matrixData?.berths.find(
                    (b) => b.number === assignedSeatNum
                  );

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {idx + 1}. {passenger.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Age: {passenger.age} • {passenger.gender}
                          </p>
                        </div>

                        {assignedSeatNum ? (
                          <span className="rounded-lg bg-blue-900 px-2.5 py-1 text-xs font-black text-white shadow-sm">
                            Berth {assignedSeatNum}{" "}
                            <span className="text-[10px] text-blue-200 font-semibold">
                              ({assignedBerthDef?.type || "LB"})
                            </span>
                          </span>
                        ) : (
                          <span className="rounded-lg bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            Click layout to assign
                          </span>
                        )}
                      </div>

                      {/* Berth Preference Dropdown */}
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Berth Preference
                        </label>
                        <select
                          value={preferences[idx] || "No preference"}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              [idx]: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                        >
                          {preferenceOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Summary & Submit Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fare Breakdown
              </h3>

              <div className="space-y-2 text-xs text-slate-600 border-b border-slate-100 pb-3">
                <div className="flex justify-between">
                  <span>Class Selected</span>
                  <span className="font-semibold text-slate-900">
                    {COACH_CLASS_NAMES[selectedClass]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Base Fare per Passenger</span>
                  <span className="font-semibold text-slate-900">
                    ₹{fare.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Passengers</span>
                  <span className="font-semibold text-slate-900">
                    × {passengerCount}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  Total Payable
                </span>
                <span className="text-xl font-black text-blue-900">
                  ₹{totalFare.toLocaleString("en-IN")}
                </span>
              </div>

              {/* 10-Minute Lock Notice */}
              <div className="flex items-start gap-2 rounded-xl bg-blue-50/70 p-3 text-[11px] text-blue-900 border border-blue-200/60">
                <Clock size={15} className="flex-shrink-0 text-blue-600 mt-0.5" />
                <span>
                  Seats are temporarily locked for 10 minutes upon proceeding to
                  prevent double-booking while you review.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={
                    selectedBerths.length !== passengerCount || isLocking
                  }
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 px-4 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLocking ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Locking Seats...
                    </>
                  ) : (
                    <>
                      Proceed to Review
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft size={13} />
                  Change Passenger Information
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BookingSeatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-xs font-semibold text-slate-500">
              Loading seat selection...
            </p>
          </div>
        </div>
      }
    >
      <SeatSelectionContent />
    </Suspense>
  );
}
