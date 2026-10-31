"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";

export type StationOption = {
  code: string;
  name: string;
  city: string;
  state?: string;
  zone?: string;
  platforms?: number;
};

interface StationComboboxProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string, station?: StationOption) => void;
  placeholder?: string;
  excludeCode?: string;
  error?: string;
  className?: string;
}

export default function StationCombobox({
  id,
  label,
  value,
  onChange,
  placeholder = "Search station or code...",
  excludeCode,
  error,
  className = "",
}: StationComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [prevPropValue, setPrevPropValue] = useState(value);
  const [results, setResults] = useState<StationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync external prop changes safely during render
  if (value !== prevPropValue) {
    setPrevPropValue(value);
    setInputValue(value);
  }

  // Debounced search query
  const searchStations = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const url = query.trim()
        ? `/api/stations?q=${encodeURIComponent(query.trim())}&limit=15`
        : "/api/stations?limit=15";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setResults(data.stations || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Failed to fetch stations:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce user input
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      searchStations(inputValue);
    }, 200);
    return () => clearTimeout(timer);
  }, [inputValue, isOpen, searchStations]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleFocus() {
    setIsOpen(true);
    if (results.length === 0) {
      searchStations(inputValue);
    }
  }

  function handleSelect(station: StationOption) {
    if (excludeCode && station.code.toUpperCase() === excludeCode.toUpperCase()) {
      return;
    }
    setInputValue(`${station.name} (${station.code})`);
    onChange(station.code, station);
    setIsOpen(false);
    setSelectedIndex(-1);
  }

  function handleClear() {
    setInputValue("");
    onChange("");
    setIsOpen(true);
    inputRef.current?.focus();
    searchStations("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
        handleSelect(filteredResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }

  // Filter out excluded code if supplied
  const filteredResults = results.filter((s) => {
    if (!excludeCode) return true;
    return s.code.toUpperCase() !== excludeCode.toUpperCase();
  });

  return (
    <div ref={containerRef} className={`relative flex flex-col ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
          <MapPin size={18} />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
            onChange(e.target.value);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id || "station"}-listbox`}
          aria-autocomplete="list"
          className={`w-full rounded-xl border bg-white py-3 pl-10 pr-10 text-sm font-semibold text-slate-900 transition placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-500/20 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-500"
              : "border-slate-200 focus:border-blue-600 dark:focus:border-blue-500"
          }`}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
          ) : inputValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Clear station"
            >
              <X size={15} />
            </button>
          ) : (
            <Search size={16} className="text-slate-400 dark:text-slate-500" />
          )}
        </div>
      </div>

      {error && <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-2xl">
          {isLoading && filteredResults.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
              Searching 9,000+ stations...
            </div>
          ) : filteredResults.length > 0 ? (
            <ul
              ref={listRef}
              id={`${id || "station"}-listbox`}
              role="listbox"
              className="divide-y divide-slate-100 dark:divide-slate-800"
            >
              {filteredResults.map((station, index) => {
                const isSelected = index === selectedIndex;
                const isExcluded =
                  excludeCode &&
                  station.code.toUpperCase() === excludeCode.toUpperCase();

                return (
                  <li
                    key={station.code}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(station)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex cursor-pointer items-center justify-between px-4 py-2.5 transition ${
                      isExcluded
                        ? "cursor-not-allowed bg-slate-50 opacity-40 dark:bg-slate-950/40"
                        : isSelected
                        ? "bg-blue-50 text-blue-950 dark:bg-blue-950/60 dark:text-blue-200"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {station.name}
                        </span>
                        <span className="inline-flex shrink-0 items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-mono font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {station.code}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {station.city}
                        {station.state ? `, ${station.state}` : ""}
                        {station.platforms ? ` • Platform ${station.platforms}` : ""}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No stations found matching &quot;{inputValue}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
