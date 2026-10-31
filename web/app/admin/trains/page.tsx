"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

type TrainStop = {
  stationCode: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
};

type TrainItem = {
  id: string;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  fare: number;
  totalSeats: number;
  availableSeats: number;
  coachTypes: string[];
  runsOn: string[];
  category?: string;
  stops?: TrainStop[];
  isDemo?: boolean;
  isActive: boolean;
};

export default function AdminTrainsPage() {
  const [trains, setTrains] = useState<TrainItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrain, setEditingTrain] = useState<TrainItem | null>(null);
  const [deletingTrain, setDeletingTrain] = useState<TrainItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form Fields
  const [formFields, setFormFields] = useState({
    trainNumber: "",
    trainName: "",
    source: "",
    destination: "",
    departure: "08:00",
    arrival: "14:00",
    duration: "6h 00m",
    fare: 750,
    totalSeats: 72,
    coachTypes: "SL, 3A, 2A, CC",
    runsOn: "Mon, Tue, Wed, Thu, Fri, Sat, Sun",
    isActive: true,
  });

  const loadTrains = useCallback(async (searchQuery = "", pageNum = 1) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const url = searchQuery
        ? `/api/admin/trains?search=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=50`
        : `/api/admin/trains?page=${pageNum}&limit=50`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (res.ok && data.success) {
        setTrains(data.trains || []);
        setCurrentPage(data.page || pageNum);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || (data.trains ? data.trains.length : 0));
      } else {
        setStatusMessage({ text: data.message || "Failed to load trains.", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Network error loading trains.", isError: true });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTrains("", 1);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTrains]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCurrentPage(1);
    void loadTrains(searchTerm, 1);
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      void loadTrains(searchTerm, newPage);
    }
  }

  function openAddModal() {
    setFormFields({
      trainNumber: "",
      trainName: "",
      source: "",
      destination: "",
      departure: "08:00",
      arrival: "14:00",
      duration: "6h 00m",
      fare: 750,
      totalSeats: 72,
      coachTypes: "SL, 3A, 2A, CC",
      runsOn: "Mon, Tue, Wed, Thu, Fri, Sat, Sun",
      isActive: true,
    });
    setIsAddModalOpen(true);
  }

  function openEditModal(train: TrainItem) {
    setEditingTrain(train);
    setFormFields({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      source: train.source,
      destination: train.destination,
      departure: train.departure,
      arrival: train.arrival,
      duration: train.duration,
      fare: train.fare,
      totalSeats: train.totalSeats,
      coachTypes: train.coachTypes.join(", "),
      runsOn: train.runsOn.join(", "),
      isActive: train.isActive,
    });
  }

  async function handleAddTrainSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/trains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formFields,
          coachTypes: formFields.coachTypes.split(",").map((s) => s.trim()).filter(Boolean),
          runsOn: formFields.runsOn.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAddModalOpen(false);
        setStatusMessage({ text: data.message });
        void loadTrains(searchTerm);
      } else {
        setStatusMessage({ text: data.message || "Failed to create train.", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Failed to submit new train.", isError: true });
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleEditTrainSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTrain) return;

    setFormSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/trains/${editingTrain.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formFields,
          coachTypes: formFields.coachTypes.split(",").map((s) => s.trim()).filter(Boolean),
          runsOn: formFields.runsOn.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setEditingTrain(null);
        setStatusMessage({ text: data.message });
        void loadTrains(searchTerm);
      } else {
        setStatusMessage({ text: data.message || "Failed to update train.", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Failed to submit train updates.", isError: true });
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingTrain) return;

    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/admin/trains/${deletingTrain.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({ text: data.message });
        setDeletingTrain(null);
        void loadTrains(searchTerm);
      } else {
        setStatusMessage({ text: data.message || "Could not delete train.", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Network error during deletion.", isError: true });
    } finally {
      setFormSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Train Management</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Managing {totalCount.toLocaleString()} trains across the all-India railway network.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadTrains(searchTerm, currentPage)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
          >
            <Plus size={16} /> Add Train
          </button>
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

      {/* SEARCH BAR */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by train number, name, origin, or destination..."
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

      {/* TRAINS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-900" />
              ))}
            </div>
          ) : trains.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No trains match your search criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold text-slate-400">
                  <th className="px-4 py-3">Number & Name</th>
                  <th className="px-4 py-3">Route (From → To)</th>
                  <th className="px-4 py-3">Timings</th>
                  <th className="px-4 py-3">Base Fare</th>
                  <th className="px-4 py-3">Coaches</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trains.map((t) => (
                  <tr key={t.id} className="transition hover:bg-slate-900/40">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-blue-400">{t.trainNumber}</span>
                        {t.category && (
                          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">
                            {t.category}
                          </span>
                        )}
                      </div>
                      <span className="block font-semibold text-white">{t.trainName}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      <span className="font-semibold">{t.source}</span>
                      <span className="text-slate-500"> → </span>
                      <span className="font-semibold">{t.destination}</span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{t.duration}</span>
                        {t.stops && t.stops.length > 0 && (
                          <span>· {t.stops.length} stops</span>
                        )}
                        {t.isDemo && (
                          <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-semibold text-amber-300">
                            Demo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {t.departure} - {t.arrival}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-200">
                      ₹{t.fare}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      <div className="flex flex-wrap gap-1">
                        {t.coachTypes.map((c) => (
                          <span key={c} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          t.isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {t.isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          title="Edit Train"
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTrain(t)}
                          title="Delete / Deactivate Train"
                          className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION BAR */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/50 px-6 py-4 text-xs">
            <span className="text-slate-400">
              Showing page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({totalCount.toLocaleString()} trains total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 font-bold text-slate-200 transition hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 font-bold text-slate-200 transition hover:bg-slate-700 disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {(isAddModalOpen || editingTrain) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-black text-white">
                {editingTrain ? `Edit Train: ${editingTrain.trainNumber}` : "Add New Train"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTrain(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={editingTrain ? handleEditTrainSubmit : handleAddTrainSubmit}
              className="mt-5 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300">Train Number</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingTrain)}
                    value={formFields.trainNumber}
                    onChange={(e) => setFormFields({ ...formFields, trainNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white disabled:opacity-60"
                    placeholder="e.g. 12002"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300">Train Name</label>
                  <input
                    type="text"
                    required
                    value={formFields.trainName}
                    onChange={(e) => setFormFields({ ...formFields, trainName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                    placeholder="e.g. Shatabdi Express"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300">Source Station</label>
                  <input
                    type="text"
                    required
                    value={formFields.source}
                    onChange={(e) => setFormFields({ ...formFields, source: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                    placeholder="e.g. New Delhi"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300">Destination Station</label>
                  <input
                    type="text"
                    required
                    value={formFields.destination}
                    onChange={(e) => setFormFields({ ...formFields, destination: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                    placeholder="e.g. Chandigarh"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300">Departure (HH:mm)</label>
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
                  <label className="block font-bold text-slate-300">Arrival (HH:mm)</label>
                  <input
                    type="text"
                    required
                    value={formFields.arrival}
                    onChange={(e) => setFormFields({ ...formFields, arrival: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                    placeholder="10:45"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300">Duration</label>
                  <input
                    type="text"
                    value={formFields.duration}
                    onChange={(e) => setFormFields({ ...formFields, duration: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                    placeholder="3h 25m"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300">Base Fare (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formFields.fare}
                    onChange={(e) => setFormFields({ ...formFields, fare: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300">Total Berths</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formFields.totalSeats}
                    onChange={(e) => setFormFields({ ...formFields, totalSeats: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300">Coach Classes (comma separated)</label>
                <input
                  type="text"
                  value={formFields.coachTypes}
                  onChange={(e) => setFormFields({ ...formFields, coachTypes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                  placeholder="SL, 3A, 2A, CC"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formFields.isActive}
                  onChange={(e) => setFormFields({ ...formFields, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600"
                />
                <label htmlFor="isActive" className="font-semibold text-slate-300">
                  Active in schedule search
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTrain(null);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 font-bold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : editingTrain ? "Save Changes" : "Create Train"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE / DEACTIVATE MODAL */}
      {deletingTrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30">
              <AlertTriangle size={24} />
            </div>

            <h3 className="mt-4 text-base font-bold text-white">
              Deactivate / Delete Train {deletingTrain.trainNumber}?
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              If this train is referenced in existing passenger bookings, it will be{" "}
              <strong className="text-amber-400">safely deactivated</strong> rather than permanently deleted,
              preserving historical booking and ticket integrity.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingTrain(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {formSubmitting ? "Processing..." : "Confirm Deactivation / Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
