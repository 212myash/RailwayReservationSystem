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

type StationItem = {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  zone: string;
  platforms: number;
  isActive: boolean;
};

export default function AdminStationsPage() {
  const [stations, setStations] = useState<StationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<StationItem | null>(null);
  const [deletingStation, setDeletingStation] = useState<StationItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form
  const [formFields, setFormFields] = useState({
    code: "",
    name: "",
    city: "",
    state: "",
    zone: "Northern Railway (NR)",
    platforms: 4,
    isActive: true,
  });

  const loadStations = useCallback(async (searchQuery = "", pageNum = 1) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const url = searchQuery
        ? `/api/admin/stations?search=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=50`
        : `/api/admin/stations?page=${pageNum}&limit=50`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (res.ok && data.success) {
        setStations(data.stations || []);
        setCurrentPage(data.page || pageNum);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || (data.stations ? data.stations.length : 0));
      } else {
        setStatusMessage({ text: data.message || "Failed to load stations.", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Network error loading stations.", isError: true });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadStations("", 1);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadStations]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCurrentPage(1);
    void loadStations(searchTerm, 1);
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      void loadStations(searchTerm, newPage);
    }
  }

  function openAddModal() {
    setFormFields({
      code: "",
      name: "",
      city: "",
      state: "",
      zone: "Northern Railway (NR)",
      platforms: 4,
      isActive: true,
    });
    setIsAddModalOpen(true);
  }

  function openEditModal(st: StationItem) {
    setEditingStation(st);
    setFormFields({
      code: st.code,
      name: st.name,
      city: st.city,
      state: st.state,
      zone: st.zone,
      platforms: st.platforms,
      isActive: st.isActive,
    });
  }

  async function handleAddStationSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formFields),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAddModalOpen(false);
        setStatusMessage({ text: data.message });
        void loadStations(searchTerm);
      } else {
        setStatusMessage({ text: data.message || "Failed to create station.", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Network error creating station.", isError: true });
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleEditStationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStation) return;

    setFormSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/stations/${editingStation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formFields),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setEditingStation(null);
        setStatusMessage({ text: data.message });
        void loadStations(searchTerm);
      } else {
        setStatusMessage({ text: data.message || "Failed to update station.", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Network error updating station.", isError: true });
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingStation) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/admin/stations/${deletingStation.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({ text: data.message });
        setDeletingStation(null);
        void loadStations(searchTerm);
      } else {
        setStatusMessage({ text: data.message || "Failed to delete station.", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Network error deleting station.", isError: true });
    } finally {
      setFormSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Station Management</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Maintain supported junction stations, zone associations, and platform capacities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadStations(searchTerm)}
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
            <Plus size={16} /> Add Station
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

      {/* SEARCH */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stations by code, junction name, city, or state..."
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

      {/* STATIONS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-900" />
              ))}
            </div>
          ) : stations.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No stations found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold text-slate-400">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Station Name</th>
                  <th className="px-4 py-3">City & State</th>
                  <th className="px-4 py-3">Railway Zone</th>
                  <th className="px-4 py-3">Platforms</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stations.map((st) => (
                  <tr key={st.id} className="transition hover:bg-slate-900/40">
                    <td className="px-4 py-3.5 font-mono font-black text-amber-400">
                      {st.code}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-white">
                      {st.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      <span>{st.city}</span>, <span className="text-slate-500">{st.state}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{st.zone}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">{st.platforms}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          st.isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {st.isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {st.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(st)}
                          title="Edit Station"
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingStation(st)}
                          title="Deactivate / Delete"
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
              Showing page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({totalCount.toLocaleString()} stations total)
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
      {(isAddModalOpen || editingStation) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-black text-white">
                {editingStation ? `Edit Station: ${editingStation.code}` : "Add Railway Station"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStation(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={editingStation ? handleEditStationSubmit : handleAddStationSubmit}
              className="mt-5 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300">Station Code</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingStation)}
                    value={formFields.code}
                    onChange={(e) => setFormFields({ ...formFields, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 font-mono font-bold uppercase text-white disabled:opacity-60"
                    placeholder="e.g. NDLS"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300">Platforms Count</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formFields.platforms}
                    onChange={(e) => setFormFields({ ...formFields, platforms: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300">Full Station Name</label>
                <input
                  type="text"
                  required
                  value={formFields.name}
                  onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                  placeholder="e.g. New Delhi Railway Station"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300">City</label>
                  <input
                    type="text"
                    required
                    value={formFields.city}
                    onChange={(e) => setFormFields({ ...formFields, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                    placeholder="e.g. New Delhi"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300">State</label>
                  <input
                    type="text"
                    required
                    value={formFields.state}
                    onChange={(e) => setFormFields({ ...formFields, state: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                    placeholder="e.g. Delhi"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300">Railway Zone</label>
                <input
                  type="text"
                  value={formFields.zone}
                  onChange={(e) => setFormFields({ ...formFields, zone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white"
                  placeholder="e.g. Northern Railway (NR)"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="stationIsActive"
                  checked={formFields.isActive}
                  onChange={(e) => setFormFields({ ...formFields, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600"
                />
                <label htmlFor="stationIsActive" className="font-semibold text-slate-300">
                  Station active for train stops
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStation(null);
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
                  {formSubmitting ? "Saving..." : editingStation ? "Save Changes" : "Add Station"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / DEACTIVATE CONFIRMATION */}
      {deletingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30">
              <AlertTriangle size={24} />
            </div>

            <h3 className="mt-4 text-base font-bold text-white">
              Deactivate / Delete {deletingStation.code} - {deletingStation.name}?
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              If active train schedules reference this station, it will be{" "}
              <strong className="text-amber-400">safely deactivated</strong> rather than permanently deleted,
              preventing route reference errors.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingStation(null)}
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
                {formSubmitting ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
