"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Armchair,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import CoachLayoutViewer from "@/components/CoachLayoutViewer";
import { CoachClass, CoachTemplate } from "@/lib/coach-templates";

interface CoachEntryState {
  coachId: string;
  coachClass: CoachClass;
  sequence: number;
  layoutTemplateId: string;
  totalCapacity: number;
  isActive: boolean;
}

interface TrainConfigState {
  trainNumber: string;
  coaches: CoachEntryState[];
  totalCoaches: number;
  totalCapacity: number;
  configurationSource: "demo" | "verified";
  version: number;
}

interface TrainInfo {
  number: string;
  name: string;
  category: string;
  coachTypes: string[];
}

export default function AdminCoachConfigurationsPage() {
  const [searchNumber, setSearchNumber] = useState("12951");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, startSavingTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const [trainInfo, setTrainInfo] = useState<TrainInfo | null>(null);
  const [config, setConfig] = useState<TrainConfigState | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<CoachTemplate[]>([]);

  // Layout preview modal state
  const [previewCoach, setPreviewCoach] = useState<CoachEntryState | null>(null);

  // Add coach modal state
  const [isAddCoachOpen, setIsAddCoachOpen] = useState(false);
  const [newCoachId, setNewCoachId] = useState("");
  const [newCoachClass, setNewCoachClass] = useState<CoachClass>("3A");
  const [newCoachTemplate, setNewCoachTemplate] = useState("3A-64");

  async function loadConfiguration(numberToLoad: string) {
    if (!numberToLoad.trim()) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(
        `/api/admin/coach-configurations?trainNumber=${encodeURIComponent(
          numberToLoad.trim()
        )}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatusMessage({
          type: "error",
          text: data.message || "Failed to load coach configuration.",
        });
        setConfig(null);
        setTrainInfo(null);
        return;
      }

      setConfig(data.configuration);
      setTrainInfo(data.train);
      if (data.availableTemplates) {
        setAvailableTemplates(data.availableTemplates);
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Could not reach the server to fetch coach configuration.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadConfiguration("12951");
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    void loadConfiguration(searchNumber);
  }

  function handleMoveCoach(index: number, direction: "up" | "down") {
    if (!config) return;
    const coaches = [...config.coaches];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= coaches.length) return;

    // Swap coaches
    const temp = coaches[index];
    coaches[index] = coaches[targetIndex];
    coaches[targetIndex] = temp;

    // Re-sequence
    coaches.forEach((c, i) => {
      c.sequence = i + 1;
    });

    setConfig({ ...config, coaches });
  }

  function handleTemplateChange(index: number, newTemplateId: string) {
    if (!config) return;
    const coaches = [...config.coaches];
    const tmpl = availableTemplates.find((t) => t.id === newTemplateId);

    if (tmpl) {
      coaches[index] = {
        ...coaches[index],
        layoutTemplateId: tmpl.id,
        coachClass: tmpl.coachClass,
        totalCapacity: tmpl.totalCapacity,
      };
      const totalCapacity = coaches
        .filter((c) => c.isActive)
        .reduce((sum, c) => sum + c.totalCapacity, 0);

      setConfig({ ...config, coaches, totalCapacity });
    }
  }

  function handleClassChange(index: number, newClass: CoachClass) {
    if (!config) return;
    const coaches = [...config.coaches];
    // Pick default template for this class
    const defaultTemplate =
      availableTemplates.find((t) => t.coachClass === newClass) ||
      availableTemplates[0];

    coaches[index] = {
      ...coaches[index],
      coachClass: newClass,
      layoutTemplateId: defaultTemplate.id,
      totalCapacity: defaultTemplate.totalCapacity,
    };

    const totalCapacity = coaches
      .filter((c) => c.isActive)
      .reduce((sum, c) => sum + c.totalCapacity, 0);

    setConfig({ ...config, coaches, totalCapacity });
  }

  function handleToggleActive(index: number) {
    if (!config) return;
    const coaches = [...config.coaches];
    coaches[index] = {
      ...coaches[index],
      isActive: !coaches[index].isActive,
    };
    const totalCapacity = coaches
      .filter((c) => c.isActive)
      .reduce((sum, c) => sum + c.totalCapacity, 0);

    setConfig({ ...config, coaches, totalCapacity });
  }

  function handleDeleteCoach(index: number) {
    if (!config) return;
    if (config.coaches.length <= 1) {
      window.alert("A train must have at least one coach.");
      return;
    }
    const coaches = config.coaches.filter((_, i) => i !== index);
    coaches.forEach((c, i) => {
      c.sequence = i + 1;
    });

    const totalCapacity = coaches
      .filter((c) => c.isActive)
      .reduce((sum, c) => sum + c.totalCapacity, 0);

    setConfig({
      ...config,
      coaches,
      totalCoaches: coaches.length,
      totalCapacity,
    });
  }

  function handleAddCoachSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;

    const trimmedId = newCoachId.trim().toUpperCase();
    if (!trimmedId) {
      window.alert("Please provide a valid Coach ID (e.g. B6, S7, A3).");
      return;
    }

    if (config.coaches.some((c) => c.coachId.toUpperCase() === trimmedId)) {
      window.alert(`Coach '${trimmedId}' already exists in this composition.`);
      return;
    }

    const tmpl = availableTemplates.find((t) => t.id === newCoachTemplate);
    const capacity = tmpl ? tmpl.totalCapacity : 72;

    const newCoach: CoachEntryState = {
      coachId: trimmedId,
      coachClass: newCoachClass,
      sequence: config.coaches.length + 1,
      layoutTemplateId: newCoachTemplate,
      totalCapacity: capacity,
      isActive: true,
    };

    const coaches = [...config.coaches, newCoach];
    const totalCapacity = coaches
      .filter((c) => c.isActive)
      .reduce((sum, c) => sum + c.totalCapacity, 0);

    setConfig({
      ...config,
      coaches,
      totalCoaches: coaches.length,
      totalCapacity,
    });

    setIsAddCoachOpen(false);
    setNewCoachId("");
  }

  function handleSaveConfiguration() {
    if (!config) return;

    startSavingTransition(async () => {
      setStatusMessage(null);
      try {
        const res = await fetch("/api/admin/coach-configurations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainNumber: config.trainNumber,
            coaches: config.coaches,
            configurationSource: config.configurationSource,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setStatusMessage({
            type: "success",
            text: `Successfully saved composition for train ${config.trainNumber}. Version ${data.configuration.version}.`,
          });
          setConfig(data.configuration);
        } else {
          setStatusMessage({
            type: "error",
            text: data.message || "Failed to save configuration.",
          });
        }
      } catch {
        setStatusMessage({
          type: "error",
          text: "An error occurred while saving the configuration.",
        });
      }
    });
  }

  async function handleResetToDefaults() {
    if (!config) return;
    const confirmReset = window.confirm(
      `Are you sure you want to reset the coach composition for Train ${config.trainNumber} to standard defaults?`
    );
    if (!confirmReset) return;

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch(
        `/api/admin/coach-configurations?trainNumber=${encodeURIComponent(
          config.trainNumber
        )}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: "info",
          text: `Reset Train ${config.trainNumber} composition to standard default generator.`,
        });
        setConfig(data.configuration);
      } else {
        setStatusMessage({
          type: "error",
          text: data.message || "Reset failed.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Reset request failed.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl flex items-center gap-2">
            <Armchair className="text-blue-400" />
            Coach Composition Manager
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Configure dynamic train compositions, assign realistic coach layout
            templates, and preview passenger seating bays.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {config && (
            <>
              <button
                type="button"
                onClick={handleResetToDefaults}
                disabled={isLoading || isSaving}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                title="Reset to default standard rake"
              >
                <RotateCcw size={14} />
                Reset Defaults
              </button>

              <button
                type="button"
                onClick={() => setIsAddCoachOpen(true)}
                disabled={isLoading || isSaving}
                className="flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm"
              >
                <Plus size={14} />
                Add Coach
              </button>

              <button
                type="button"
                onClick={handleSaveConfiguration}
                disabled={isLoading || isSaving}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
              >
                {isSaving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Train Lookup Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              placeholder="Search train by number (e.g. 12951, 12276, 12002)..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            {isLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Load Train
          </button>
        </form>

        {/* Quick Select Train Suggestions */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>Quick load demo trains:</span>
          {["12951", "12276", "12002", "12301", "12431", "12626"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                setSearchNumber(num);
                void loadConfiguration(num);
              }}
              className="rounded bg-slate-800 px-2.5 py-1 font-mono text-blue-400 hover:bg-slate-700 hover:text-blue-300 transition-colors"
            >
              #{num}
            </button>
          ))}
        </div>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3.5 text-xs sm:text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-950/80 border border-emerald-700 text-emerald-200"
              : statusMessage.type === "error"
              ? "bg-rose-950/80 border border-rose-700 text-rose-200"
              : "bg-blue-950/80 border border-blue-700 text-blue-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <ShieldAlert size={16} />
          )}
          {statusMessage.text}
        </div>
      )}

      {/* Train Header & Stats Summary */}
      {config && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-lg font-black text-blue-400">
                  #{config.trainNumber}
                </span>
                <span className="text-lg font-bold text-white">
                  {trainInfo?.name || "Train Rake"}
                </span>
                <span className="rounded bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                  {trainInfo?.category || "Express"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Classes configured:{" "}
                <span className="text-slate-200">
                  {Array.from(new Set(config.coaches.map((c) => c.coachClass))).join(", ")}
                </span>
              </p>
            </div>

            {/* Source Badge Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Config Status:</span>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    configurationSource:
                      config.configurationSource === "demo" ? "verified" : "demo",
                  })
                }
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                  config.configurationSource === "verified"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
                title="Click to toggle between DEMO DATA and VERIFIED CONFIGURATION"
              >
                {config.configurationSource === "verified"
                  ? "✓ Verified Configuration"
                  : "⚠ Demo Data Rake"}
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Coaches
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {config.coaches.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Capacity
              </p>
              <p className="mt-1 text-2xl font-black text-blue-400">
                {config.totalCapacity} <span className="text-xs font-normal text-slate-400">berths</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Coaches
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-400">
                {config.coaches.filter((c) => c.isActive).length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Rake Version
              </p>
              <p className="mt-1 text-2xl font-black text-purple-400">
                v{config.version || 1}
              </p>
            </div>
          </div>

          {/* Coaches Table */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Seq</th>
                    <th className="py-3 px-4">Coach ID</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Layout Template</th>
                    <th className="py-3 px-4 text-center">Capacity</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {config.coaches.map((coach, index) => (
                    <tr
                      key={coach.coachId + index}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        !coach.isActive ? "opacity-50" : ""
                      }`}
                    >
                      {/* Sequence & Move Controls */}
                      <td className="py-3 px-4 font-mono font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span>{coach.sequence}</span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMoveCoach(index, "up")}
                              disabled={index === 0}
                              className="text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move up"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCoach(index, "down")}
                              disabled={index === config.coaches.length - 1}
                              className="text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move down"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Coach ID */}
                      <td className="py-3 px-4">
                        <span className="rounded bg-slate-800 px-2.5 py-1 font-mono font-bold text-white border border-slate-700">
                          {coach.coachId}
                        </span>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4">
                        <select
                          value={coach.coachClass}
                          onChange={(e) =>
                            handleClassChange(index, e.target.value as CoachClass)
                          }
                          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="SL">Sleeper (SL)</option>
                          <option value="3A">AC 3 Tier (3A)</option>
                          <option value="2A">AC 2 Tier (2A)</option>
                          <option value="1A">AC First (1A)</option>
                          <option value="CC">AC Chair Car (CC)</option>
                          <option value="2S">Second Seating (2S)</option>
                        </select>
                      </td>

                      {/* Template Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={coach.layoutTemplateId}
                          onChange={(e) =>
                            handleTemplateChange(index, e.target.value)
                          }
                          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                        >
                          {availableTemplates.map((tmpl) => (
                            <option key={tmpl.id} value={tmpl.id}>
                              {tmpl.name} ({tmpl.totalCapacity} berths)
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Capacity */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-200">
                        {coach.totalCapacity}
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(index)}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            coach.isActive
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-700/60 text-slate-400 border border-slate-600"
                          }`}
                        >
                          {coach.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewCoach(coach)}
                            className="flex items-center gap-1 rounded bg-blue-900/40 px-2.5 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-900/70 border border-blue-700/40 transition-colors"
                            title="Preview Coach Seating Layout"
                          >
                            <Eye size={13} />
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoach(index)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-900/50 hover:text-rose-300 transition-colors"
                            title="Remove coach"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preview Layout */}
      {previewCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Armchair className="text-blue-400" />
                <h3 className="text-lg font-bold">
                  Layout Preview: Coach {previewCoach.coachId} ({previewCoach.coachClass})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCoach(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-slate-900">
              <CoachLayoutViewer
                layoutTemplateId={previewCoach.layoutTemplateId}
                coachId={previewCoach.coachId}
                coachClass={previewCoach.coachClass}
                interactive={false}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewCoach(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Coach */}
      {isAddCoachOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus size={16} className="text-blue-400" />
                Add New Coach to Rake
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCoachOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCoachSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Coach Identifier (e.g. S7, B6, A2, H2)
                </label>
                <input
                  type="text"
                  required
                  value={newCoachId}
                  onChange={(e) => setNewCoachId(e.target.value.toUpperCase())}
                  placeholder="e.g. B6"
                  maxLength={6}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Coach Class
                </label>
                <select
                  value={newCoachClass}
                  onChange={(e) => {
                    const cls = e.target.value as CoachClass;
                    setNewCoachClass(cls);
                    const matchingTmpl = availableTemplates.find(
                      (t) => t.coachClass === cls
                    );
                    if (matchingTmpl) setNewCoachTemplate(matchingTmpl.id);
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="SL">Sleeper Class (SL)</option>
                  <option value="3A">AC 3 Tier (3A)</option>
                  <option value="2A">AC 2 Tier (2A)</option>
                  <option value="1A">AC First Class (1A)</option>
                  <option value="CC">AC Chair Car (CC)</option>
                  <option value="2S">Second Seating (2S)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Layout Template
                </label>
                <select
                  value={newCoachTemplate}
                  onChange={(e) => setNewCoachTemplate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  {availableTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.totalCapacity} berths)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCoachOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  Add Coach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
