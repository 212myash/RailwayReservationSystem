"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Inbox,
  LogIn,
  Megaphone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  Trash2,
  XCircle,
} from "lucide-react";

type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "journey_reminder"
  | "password_changed"
  | "system_announcement";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type PaginationMeta = {
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
};

type FilterType = "all" | "unread" | "read";

function formatRelativeTime(dateInput: string | Date): string {
  try {
    const date = new Date(dateInput);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (Number.isNaN(diffSeconds) || diffSeconds < 0) return "Just now";
    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
}

function formatFullDateTime(isoStr: string): string {
  try {
    const date = new Date(isoStr);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function NotificationTypeBadge({ type }: { type: NotificationType }) {
  switch (type) {
    case "booking_confirmed":
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <Ticket size={20} />
        </span>
      );
    case "booking_cancelled":
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-200">
          <XCircle size={20} />
        </span>
      );
    case "journey_reminder":
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <Clock size={20} />
        </span>
      );
    case "password_changed":
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-200">
          <ShieldCheck size={20} />
        </span>
      );
    case "system_announcement":
    default:
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200">
          <Megaphone size={20} />
        </span>
      );
  }
}

function NotificationsContent() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") as FilterType) || "all";

  const [filter, setFilter] = useState<FilterType>(
    ["all", "unread", "read"].includes(initialFilter) ? initialFilter : "all"
  );
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    unreadCount: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
    hasMore: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (targetFilter: FilterType, targetPage: number) => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const queryParams = new URLSearchParams({
          page: targetPage.toString(),
          limit: "15",
          filter: targetFilter,
        });

        const res = await fetch(`/api/notifications?${queryParams.toString()}`, {
          cache: "no-store",
        });

        if (res.status === 401) {
          setIsLoggedOut(true);
          setNotifications([]);
          setIsLoading(false);
          return;
        }

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMessage(data.message || "Failed to load notifications.");
          setIsLoading(false);
          return;
        }

        setNotifications(data.notifications || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        setIsLoggedOut(false);
      } catch {
        setErrorMessage("Network error: Unable to connect to notifications service.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNotifications(filter, page);
    }, 0);

    return () => clearTimeout(timer);
  }, [filter, page, fetchNotifications]);

  function handleFilterChange(newFilter: FilterType) {
    setFilter(newFilter);
    setPage(1);
  }

  async function handleToggleRead(item: Notification) {
    const nextRead = !item.isRead;
    setActionInProgress(item.id);

    try {
      const res = await fetch(`/api/notifications/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: nextRead }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        window.alert(data.message || "Could not update notification status.");
        return;
      }

      // Optimistic state update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: nextRead } : n))
      );

      setPagination((prev) => ({
        ...prev,
        unreadCount: Math.max(
          0,
          prev.unreadCount + (nextRead ? -1 : 1)
        ),
      }));
    } catch {
      window.alert("Network error: Could not update notification.");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleDelete(item: Notification) {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    setActionInProgress(item.id);

    try {
      const res = await fetch(`/api/notifications/${item.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        window.alert(data.message || "Could not delete notification.");
        return;
      }

      setNotifications((prev) => prev.filter((n) => n.id !== item.id));

      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        unreadCount: !item.isRead
          ? Math.max(0, prev.unreadCount - 1)
          : prev.unreadCount,
      }));
    } catch {
      window.alert("Network error: Could not delete notification.");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleMarkAllAsRead() {
    setActionInProgress("mark-all");

    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        window.alert(data.message || "Failed to mark all as read.");
        return;
      }

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );

      setPagination((prev) => ({
        ...prev,
        unreadCount: 0,
      }));
    } catch {
      window.alert("Network error: Failed to update notifications.");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleClearReadNotifications() {
    if (
      !window.confirm(
        "Are you sure you want to clear all read notifications? This cannot be undone."
      )
    ) {
      return;
    }

    setActionInProgress("clear-read");

    try {
      const res = await fetch("/api/notifications?scope=read", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        window.alert(data.message || "Failed to clear read notifications.");
        return;
      }

      // Refresh current view
      await fetchNotifications(filter, 1);
      setPage(1);
    } catch {
      window.alert("Network error: Failed to clear notifications.");
    } finally {
      setActionInProgress(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 transition-colors dark:bg-slate-950">
      {/* HEADER HERO */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 px-5 py-12 text-white sm:px-8 sm:py-16 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 transition hover:text-white"
          >
            ← Back to Home
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-blue-100 backdrop-blur-md">
                <Bell size={14} className="text-blue-300" />
                RailConnect Alerts & Notifications
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Notification Center
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100/90 sm:text-base">
                Stay informed with real-time updates regarding your train reservations,
                booking cancellations, journey alerts, and account security.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-200">
                  Unread Alerts
                </span>
                <span className="mt-0.5 block text-2xl font-black text-white">
                  {pagination.unreadCount}
                </span>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-200">
                  Total Records
                </span>
                <span className="mt-0.5 block text-2xl font-black text-white">
                  {pagination.total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <div className="mx-auto mt-6 max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* UNLOGGED BANNER */}
        {isLoggedOut && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert size={24} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="flex-1">
                <h2 className="text-base font-bold text-amber-950">
                  Authentication Required
                </h2>
                <p className="mt-1 text-sm text-amber-800">
                  Please log in to your RailConnect account to view your private
                  booking notifications and security alerts.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link
                    href="/login?redirect=/notifications"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800"
                  >
                    <LogIn size={15} />
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100/50"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR BANNER */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            <div className="flex items-center justify-between gap-3">
              <p>{errorMessage}</p>
              <button
                type="button"
                onClick={() => fetchNotifications(filter, page)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-50"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          </div>
        )}

        {!isLoggedOut && (
          <div className="space-y-6">
            {/* CONTROLS BAR */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
              {/* FILTER TABS */}
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => handleFilterChange("all")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    filter === "all"
                      ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() => handleFilterChange("unread")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    filter === "unread"
                      ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  Unread
                  {pagination.unreadCount > 0 && (
                    <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-black text-white">
                      {pagination.unreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleFilterChange("read")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    filter === "read"
                      ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  Read
                </button>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={
                    pagination.unreadCount === 0 ||
                    actionInProgress === "mark-all"
                  }
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 disabled:opacity-40"
                >
                  <CheckCheck size={14} />
                  Mark all as read
                </button>

                <button
                  type="button"
                  disabled={actionInProgress === "clear-read"}
                  onClick={handleClearReadNotifications}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                >
                  <Trash2 size={14} />
                  Clear read
                </button>

                <button
                  type="button"
                  onClick={() => fetchNotifications(filter, page)}
                  disabled={isLoading}
                  title="Refresh"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={isLoading ? "animate-spin text-blue-600" : ""}
                  />
                </button>
              </div>
            </div>

            {/* NOTIFICATIONS LIST */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-slate-200" />
                      <div className="h-3 w-4/5 rounded bg-slate-100" />
                      <div className="h-3 w-1/4 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Inbox size={32} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {filter === "unread"
                    ? "All caught up!"
                    : filter === "read"
                    ? "No read notifications"
                    : "No notifications yet"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {filter === "unread"
                    ? "You have zero unread notifications. Check back when you make a booking."
                    : filter === "read"
                    ? "You haven't marked any notifications as read yet."
                    : "Alerts about your bookings, journeys, and account will appear here."}
                </p>
                {filter !== "all" && (
                  <button
                    type="button"
                    onClick={() => handleFilterChange("all")}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    View All Notifications
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((item) => (
                  <article
                    key={item.id}
                    className={`group relative flex flex-col gap-3 rounded-2xl border p-4 shadow-sm transition sm:flex-row sm:items-start sm:gap-4 sm:p-5 ${
                      !item.isRead
                        ? "border-blue-200/90 bg-blue-50/30"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <NotificationTypeBadge type={item.type} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h4
                          className={`text-sm ${
                            !item.isRead
                              ? "font-black text-slate-950"
                              : "font-bold text-slate-800"
                          }`}
                        >
                          {item.title}
                        </h4>

                        {!item.isRead && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            New
                          </span>
                        )}

                        <span
                          title={formatFullDateTime(item.createdAt)}
                          className="ml-auto text-xs text-slate-400"
                        >
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {item.message}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {item.actionUrl && (
                          <Link
                            href={item.actionUrl}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 transition hover:text-blue-900 hover:underline"
                          >
                            View Details
                            <ExternalLink size={12} />
                          </Link>
                        )}

                        <button
                          type="button"
                          disabled={actionInProgress === item.id}
                          onClick={() => handleToggleRead(item)}
                          className="text-xs font-semibold text-slate-500 transition hover:text-slate-800 hover:underline disabled:opacity-40"
                        >
                          {item.isRead ? "Mark as unread" : "Mark as read"}
                        </button>

                        <button
                          type="button"
                          disabled={actionInProgress === item.id}
                          onClick={() => handleDelete(item)}
                          title="Delete notification"
                          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-red-600 disabled:opacity-40"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* PAGINATION CONTROLS */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-4">
                <p className="text-xs text-slate-500">
                  Page <span className="font-bold text-slate-900">{page}</span> of{" "}
                  <span className="font-bold text-slate-900">
                    {pagination.totalPages}
                  </span>{" "}
                  ({pagination.total} alerts)
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={page >= pagination.totalPages || isLoading}
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Loading notifications...
          </p>
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
