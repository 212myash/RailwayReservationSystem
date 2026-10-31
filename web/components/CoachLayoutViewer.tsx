"use client";

import React from "react";
import { Lock, UserCheck } from "lucide-react";
import {
  BerthDefinition,
  BerthType,
  getTemplate,
} from "@/lib/coach-templates";

export interface CoachBerthItem extends BerthDefinition {
  status?: "available" | "locked" | "booked";
  isLockedByMe?: boolean;
}

interface CoachLayoutViewerProps {
  layoutTemplateId: string;
  coachId?: string;
  coachClass?: string;
  berths?: CoachBerthItem[];
  selectedBerthNumbers?: number[];
  onToggleBerth?: (berthNumber: number) => void;
  interactive?: boolean;
}

export default function CoachLayoutViewer({
  layoutTemplateId,
  coachId,
  coachClass,
  berths: propBerths,
  selectedBerthNumbers = [],
  onToggleBerth,
  interactive = false,
}: CoachLayoutViewerProps) {
  const template = getTemplate(layoutTemplateId);

  // If no live berths passed (e.g. In admin preview), generate template berths with available status
  const berths: CoachBerthItem[] =
    propBerths && propBerths.length > 0
      ? propBerths
      : template.generateBerths().map((b) => ({
          ...b,
          status: "available",
        }));

  const berthMap = new Map<number, CoachBerthItem>();
  for (const b of berths) {
    berthMap.set(b.number, b);
  }

  const renderBerthButton = (seatNum: number) => {
    const berth = berthMap.get(seatNum);
    if (!berth) return null;

    const isSelected = selectedBerthNumbers.includes(seatNum);
    const isBooked = berth.status === "booked";
    const isLockedOther =
      berth.status === "locked" && !berth.isLockedByMe && !isSelected;
    const isLockedByMe = berth.isLockedByMe || isSelected;

    let buttonClasses =
      "relative flex flex-col items-center justify-center rounded-lg border text-center transition-all ";

    if (isBooked) {
      buttonClasses +=
        "border-slate-300 bg-slate-200/80 text-slate-400 cursor-not-allowed";
    } else if (isLockedOther) {
      buttonClasses +=
        "border-amber-300 bg-amber-50 text-amber-800 cursor-not-allowed shadow-sm";
    } else if (isSelected || isLockedByMe) {
      buttonClasses +=
        "border-blue-700 bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold ring-2 ring-blue-400";
    } else {
      buttonClasses +=
        "border-slate-300 bg-white text-slate-800 hover:border-blue-500 hover:bg-blue-50/70 hover:shadow-sm cursor-pointer";
    }

    const handleClick = () => {
      if (!interactive) return;
      if (isBooked || isLockedOther) return;
      if (onToggleBerth) {
        onToggleBerth(seatNum);
      }
    };

    return (
      <button
        key={seatNum}
        type="button"
        disabled={!interactive || isBooked || isLockedOther}
        onClick={handleClick}
        className={`${buttonClasses} h-12 w-11 sm:h-14 sm:w-13 p-0.5`}
        title={`Berth ${seatNum} (${berth.label}) - ${
          isBooked
            ? "Booked"
            : isLockedOther
            ? "Locked by another passenger"
            : isSelected
            ? "Selected"
            : "Available"
        }`}
      >
        <span className="text-xs sm:text-sm font-bold leading-none">
          {seatNum}
        </span>
        <span
          className={`mt-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-tight ${
            isSelected || isLockedByMe
              ? "text-blue-100"
              : isBooked
              ? "text-slate-400"
              : isLockedOther
              ? "text-amber-700"
              : "text-slate-500"
          }`}
        >
          {getBerthTypeBadge(berth.type)}
        </span>

        {isLockedOther && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-white">
            <Lock size={8} />
          </span>
        )}
        {isSelected && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <UserCheck size={9} />
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full select-none">
      {/* Coach Info Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700">
        <div className="flex items-center gap-3 font-semibold">
          {coachId && (
            <span className="rounded bg-blue-900 px-2.5 py-1 text-white">
              Coach {coachId}
            </span>
          )}
          <span>{template.name}</span>
          {coachClass && (
            <span className="text-slate-500">({coachClass})</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-medium">
          <span>Capacity: {template.totalCapacity} berths</span>
          <span>{template.compartmentCount} compartments</span>
        </div>
      </div>

      {/* Coach Layout Body */}
      <div className="relative overflow-x-auto rounded-xl border-2 border-slate-300 bg-slate-100 p-3 sm:p-5 shadow-inner">
        {/* Entry / Corridor Indicators */}
        <div className="mb-3 flex items-center justify-between border-b border-dashed border-slate-300 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span>◀ Door / Gangway</span>
          <span className="text-slate-500">
            {template.coachClass === "1A"
              ? "Private Cabins & Coupes Corridor"
              : "Passenger Gangway Corridor"}
          </span>
          <span>Door / Toilet ▶</span>
        </div>

        {/* Layout Renderer Based on Template Type */}
        {template.id === "1A-22" ? (
          render1ACabinsAndCoupes(renderBerthButton)
        ) : template.coachClass === "2A" ? (
          render2ABays(template.compartmentCount, renderBerthButton)
        ) : template.coachClass === "SL" || template.coachClass === "3A" ? (
          render3AAndSLBays(template.compartmentCount, renderBerthButton)
        ) : (
          renderChairCarRows(template.id, renderBerthButton)
        )}

        <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-300 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span>Windows / Track View</span>
          <span>Indian Railways Standard Layout</span>
          <span>Aisle Window View</span>
        </div>
      </div>
    </div>
  );
}

function getBerthTypeBadge(type: BerthType): string {
  switch (type) {
    case "LB":
    case "CABIN_LB":
    case "COUPE_LB":
      return "LB";
    case "MB":
      return "MB";
    case "UB":
    case "CABIN_UB":
    case "COUPE_UB":
      return "UB";
    case "SL":
      return "SL";
    case "SU":
      return "SU";
    case "WINDOW":
      return "WIN";
    case "MIDDLE":
      return "MID";
    case "AISLE":
      return "AIS";
    default:
      return type;
  }
}

/**
 * Renders Standard SL and 3A Bays (6 inner berths in 2 facing rows of 3 + Aisle + 2 side berths).
 */
function render3AAndSLBays(
  compartmentCount: number,
  renderBerth: (seatNum: number) => React.ReactNode
) {
  const bays = Array.from({ length: compartmentCount }, (_, i) => i + 1);

  return (
    <div className="flex gap-3 sm:gap-4 pb-2">
      {bays.map((bay) => {
        const start = (bay - 1) * 8;
        return (
          <div
            key={bay}
            className="flex-shrink-0 rounded-xl border border-slate-300 bg-white p-2.5 shadow-sm"
          >
            <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-blue-900 border-b pb-1">
              Bay {bay}
            </div>

            {/* Inner Berths (2 benches of 3: LB, MB, UB) */}
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              {/* Left Bench */}
              <div className="flex flex-col gap-1.5">
                {renderBerth(start + 1)} {/* LB */}
                {renderBerth(start + 2)} {/* MB */}
                {renderBerth(start + 3)} {/* UB */}
              </div>

              {/* Table / Center space */}
              <div className="flex w-3 items-center justify-center border-l border-r border-dashed border-slate-300">
                <span className="h-6 w-1 rounded bg-slate-300" />
              </div>

              {/* Right Bench */}
              <div className="flex flex-col gap-1.5">
                {renderBerth(start + 4)} {/* LB */}
                {renderBerth(start + 5)} {/* MB */}
                {renderBerth(start + 6)} {/* UB */}
              </div>
            </div>

            {/* Aisle Corridor */}
            <div className="my-2 flex items-center justify-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <span>—— Aisle ——</span>
            </div>

            {/* Side Berths */}
            <div className="flex justify-center gap-2 bg-amber-50/40 p-1.5 rounded-lg border border-amber-200/60">
              {renderBerth(start + 7)} {/* SL */}
              {renderBerth(start + 8)} {/* SU */}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Renders AC 2 Tier (2A) Bays (4 inner berths: LB, UB | LB, UB - NO middle berths! + Aisle + 2 side berths).
 */
function render2ABays(
  compartmentCount: number,
  renderBerth: (seatNum: number) => React.ReactNode
) {
  const bays = Array.from({ length: compartmentCount }, (_, i) => i + 1);

  return (
    <div className="flex gap-3 sm:gap-4 pb-2">
      {bays.map((bay) => {
        const start = (bay - 1) * 6;
        return (
          <div
            key={bay}
            className="flex-shrink-0 rounded-xl border border-slate-300 bg-white p-2.5 shadow-sm"
          >
            <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-indigo-900 border-b pb-1">
              Bay {bay} <span className="text-[9px] text-slate-400">(2A)</span>
            </div>

            {/* Inner Berths (4 berths only: 2 LB, 2 UB) */}
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              {/* Left Bench */}
              <div className="flex flex-col gap-2">
                {renderBerth(start + 1)} {/* LB */}
                {renderBerth(start + 2)} {/* UB */}
              </div>

              {/* Table / Spacious aisle */}
              <div className="flex w-4 items-center justify-center border-l border-r border-dashed border-slate-300">
                <span className="h-8 w-1.5 rounded bg-slate-300" />
              </div>

              {/* Right Bench */}
              <div className="flex flex-col gap-2">
                {renderBerth(start + 3)} {/* LB */}
                {renderBerth(start + 4)} {/* UB */}
              </div>
            </div>

            {/* Aisle Corridor */}
            <div className="my-2 flex items-center justify-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <span>—— Aisle ——</span>
            </div>

            {/* Side Berths */}
            <div className="flex justify-center gap-2 bg-amber-50/40 p-1.5 rounded-lg border border-amber-200/60">
              {renderBerth(start + 5)} {/* SL */}
              {renderBerth(start + 6)} {/* SU */}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Renders AC First Class (1A-22): 4 Private Lockable Cabins (A-D, 4 berths each)
 * and 3 Private Lockable Coupes (E-G, 2 berths each).
 */
function render1ACabinsAndCoupes(
  renderBerth: (seatNum: number) => React.ReactNode
) {
  const cabins = [
    { code: "Cabin A", start: 1 },
    { code: "Cabin B", start: 5 },
    { code: "Cabin C", start: 9 },
    { code: "Cabin D", start: 13 },
  ];

  const coupes = [
    { code: "Coupe E", start: 17 },
    { code: "Coupe F", start: 19 },
    { code: "Coupe G", start: 21 },
  ];

  return (
    <div className="space-y-4 pb-2">
      {/* 4-Berth Cabins Section */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-600" />
          4-Berth Private Cabins (Cabins A to D)
        </div>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1">
          {cabins.map((c) => (
            <div
              key={c.code}
              className="flex-shrink-0 rounded-xl border-2 border-purple-200 bg-purple-50/30 p-3 shadow-sm"
            >
              <div className="mb-2 text-center text-xs font-bold text-purple-900 border-b border-purple-200 pb-1">
                {c.code}
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-2">
                  {renderBerth(c.start)} {/* Lower */}
                  {renderBerth(c.start + 1)} {/* Upper */}
                </div>
                <div className="flex w-4 items-center justify-center border-l border-r border-dashed border-purple-300">
                  <span className="h-6 w-1 rounded bg-purple-300" />
                </div>
                <div className="flex flex-col gap-2">
                  {renderBerth(c.start + 2)} {/* Lower */}
                  {renderBerth(c.start + 3)} {/* Upper */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Berth Coupes Section */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          2-Berth Private Coupes (Coupes E to G)
        </div>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1">
          {coupes.map((c) => (
            <div
              key={c.code}
              className="flex-shrink-0 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 p-3 shadow-sm"
            >
              <div className="mb-2 text-center text-xs font-bold text-emerald-900 border-b border-emerald-200 pb-1">
                {c.code}
              </div>
              <div className="flex flex-col gap-2 items-center">
                {renderBerth(c.start)} {/* Lower */}
                {renderBerth(c.start + 1)} {/* Upper */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders Chair Car (CC / 2S) Rows.
 */
function renderChairCarRows(
  templateId: string,
  renderBerth: (seatNum: number) => React.ReactNode
) {
  const is2S = templateId === "2S-108";
  const rows = is2S ? 18 : 15;

  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
      {Array.from({ length: rows }, (_, i) => i + 1).map((row) => {
        let leftSeats: number[] = [];
        let rightSeats: number[] = [];

        if (is2S) {
          const start = (row - 1) * 6;
          leftSeats = [start + 1, start + 2, start + 3];
          rightSeats = [start + 4, start + 5, start + 6];
        } else {
          // CC-73: rows 1-14 have 5 seats, row 15 has 3 seats
          if (row < 15) {
            const start = (row - 1) * 5;
            leftSeats = [start + 1, start + 2, start + 3];
            rightSeats = [start + 4, start + 5];
          } else {
            leftSeats = [71, 72, 73];
            rightSeats = [];
          }
        }

        return (
          <div
            key={row}
            className="flex-shrink-0 rounded-xl border border-slate-300 bg-white p-2.5 shadow-sm"
          >
            <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b pb-1">
              Row {row}
            </div>

            <div className="flex flex-col gap-1.5">
              {leftSeats.map((num) => renderBerth(num))}
            </div>

            <div className="my-2 flex items-center justify-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <span>— Aisle —</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {rightSeats.map((num) => renderBerth(num))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
