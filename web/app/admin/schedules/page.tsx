"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Edit2,
  Info,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

type ScheduleItem = {
  id: string;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  runsOn: string[];
  fare: number;
  isActive: boolean;
};

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Edit Modal
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [formFields, setFormFields] = useState({
    trainNumber: "",
    departure: "",
    arrival: "",
    duration: "",
    runsOn: [] as string[],
    isActive: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadSchedules = useCallback(async (searchQuery = "") => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const url = searchQuery
        ? `/api/admin/schedules?search=${encodeURIComponent(searchQuery)}`
        : "/api/admin/schedules";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (res.ok && data.success) {
        setSchedules(data.schedules || []);
      } else {
        setStatusMessage({ text: data.message || "Failed to load schedules.", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Network error loading schedules.", isError: true });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSchedules();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSchedules]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    void loadSchedules(searchTerm);
  }

  function openEditModal(item: ScheduleItem) {
    setEditingSchedule(item);
    setFormFields({
      trainNumber: item.trainNumber,
      departure: item.departure,
      arrival: item.arrival,
      duration: item.duration,
      runsOn: item.runsOn || ALL_DAYS,
      isActive: item.isActive,
    });
  }

  function toggleDay(day: string) {
    if (formFields.runsOn.includes(day)) {
      setFormFields({
        ...formFields,
        runsOn: formFields.runsOn.filter((d) => d !== day),
      });
    } else {
      setFormFields({
        ...formFields,
        runsOn: [...formFields.runsOn, day],
      });
    }
  }

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSchedule) return;

    setFormSubmitting(true);
    try {
      const res = await fetch("/api/admin/schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formFields),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setEditingSchedule(null);
        setStatusMessage({ text: data.message });
        void loadSchedules(searchTerm);
      } else {
        setStatusMessage({ text: data.message || "Failed to update schedule.", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Failed to submit schedule updates.", isError: true });
    } finally {
      setFormSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Train Schedules</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Control departure and arrival windows, running day frequencies, and operational statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadSchedules(searchTerm)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* DEMO NOTICE BANNER */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-blue-200">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-400" />
        <div>
          <span className="font-bold">Demonstration Scheduling System:</span> All timetable
          modifications take immediate effect inside the RailConnect search engine. These schedules
          are demonstration timetables and do not connect to external Indian Railways / CRIS networks.
        </div>
      </div>

      {/* STATUS BANNER */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold ${
            statusMessage.isError
              ? "border border-red-500/20 bg-red-500/10 text-red-300"
              : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* SEARCH */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search timetable by train number, name, origin, or destination..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
        >
          Search
        </button>
      </form>

      {/* SCHEDULE TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-900" />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No schedules found matching your query.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold text-slate-400">
                  <th className="px-4 py-3">Train</th>
                  <th className="px-4 py-3">Origin Station</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Timetable</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Operating Days</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {schedules.map((s) => (
                  <tr key={s.id} className="transition hover:bg-slate-900/40">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-black text-blue-400">{s.trainNumber}</span>
                      <span className="block font-semibold text-white truncate max-w-36">{s.trainName}</span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-200">{s.source}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-200">{s.destination}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      <span className="text-emerald-400 font-bold">{s.departure}</span>
                      <span className="text-slate-500"> → </span>
                      <span className="text-amber-400 font-bold">{s.arrival}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-medium">{s.duration}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {ALL_DAYS.map((day) => {
                          const runs = s.runsOn?.includes(day);
                          return (
                            <span
                              key={day}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                runs
                                  ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30"
                                  : "bg-slate-900 text-slate-600"
                              }`}
                            >
                              {day}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          s.isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {s.isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {s.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(s)}
                        title="Edit Timetable & Days"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* EDIT SCHEDULE MODAL */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-black text-white">
                  Edit Schedule: {editingSchedule.trainNumber}
                </h2>
                <p className="text-xs text-slate-400">{editingSchedule.trainName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300">Departure Time (HH:mm)</label>
                  <input
                    type="text"
                    required
                    value={formFields.departure}
                    onChange={(e) => setFormFields({ ...formFields, departure: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                    placeholder="07:20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300">Arrival Time (HH:mm)</label>
                  <input
                    type="text"
                    required
                    value={formFields.arrival}
                    onChange={(e) => setFormFields({ ...formFields, arrival: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                    placeholder="10:45"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300">Calculated Journey Duration</label>
                <input
                  type="text"
                  required
                  value={formFields.duration}
                  onChange={(e) => setFormFields({ ...formFields, duration: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                  placeholder="e.g. 3h 25m"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Running Days</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const selected = formFields.runsOn.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          selected
                            ? "bg-blue-600 text-white"
                            : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="scheduleIsActive"
                  checked={formFields.isActive}
                  onChange={(e) => setFormFields({ ...formFields, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600"
                />
                <label htmlFor="scheduleIsActive" className="font-semibold text-slate-300">
                  Train active in route schedule
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 font-bold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : "Save Timetable Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
