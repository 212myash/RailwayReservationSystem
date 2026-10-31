"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  UserMinus,
  X,
} from "lucide-react";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
    hasMore: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Role Change Confirmation Modal
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: UserItem;
    targetRole: "user" | "admin";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = useCallback(
    async (targetRole: string, targetSearch: string, targetPage: number) => {
      setIsLoading(true);
      setStatusMessage(null);
      try {
        const queryParams = new URLSearchParams({
          page: targetPage.toString(),
          limit: "15",
          role: targetRole,
          ...(targetSearch ? { search: targetSearch } : {}),
        });

        const res = await fetch(`/api/admin/users?${queryParams.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setUsers(data.users || []);
          if (data.pagination) setPagination(data.pagination);
        } else {
          setStatusMessage({ text: data.message || "Failed to load user accounts.", isError: true });
        }
      } catch {
        setStatusMessage({ text: "Network error loading user accounts.", isError: true });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers(roleFilter, searchTerm, page);
    }, 0);
    return () => clearTimeout(timer);
  }, [roleFilter, searchTerm, page, loadUsers]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    void loadUsers(roleFilter, searchTerm, 1);
  }

  function handleRoleFilterChange(newRole: string) {
    setRoleFilter(newRole);
    setPage(1);
  }

  async function handleConfirmRoleChange() {
    if (!pendingRoleChange) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${pendingRoleChange.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: pendingRoleChange.targetRole }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({ text: data.message });
        setPendingRoleChange(null);
        void loadUsers(roleFilter, searchTerm, page);
      } else {
        setStatusMessage({ text: data.message || "Failed to update role.", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Network error modifying user role.", isError: true });
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">User Management</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            View passenger accounts, verify registered identities, and manage administrator privileges.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadUsers(roleFilter, searchTerm, page)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
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

      {/* CONTROLS */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 p-1 text-xs">
          {["all", "user", "admin"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleFilterChange(r)}
              className={`rounded-lg px-3.5 py-1.5 font-bold capitalize transition ${
                roleFilter === r
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {r === "all" ? "All Users" : r === "user" ? "Passengers" : "Admins"}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-md gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by full name or email address..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* USERS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-900" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No user accounts found matching your query.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold text-slate-400">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Registered On</th>
                  <th className="px-4 py-3 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-900/40">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                          <CircleUserRound size={18} />
                        </span>
                        <span className="font-bold text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          u.role === "admin"
                            ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {u.role === "admin" ? <ShieldCheck size={11} /> : null}
                        {u.role === "admin" ? "Administrator" : "Passenger"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      {u.role === "user" ? (
                        <button
                          type="button"
                          onClick={() => setPendingRoleChange({ user: u, targetRole: "admin" })}
                          className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-500/20"
                        >
                          <UserCheck size={12} />
                          Promote to Admin
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingRoleChange({ user: u, targetRole: "user" })}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700"
                        >
                          <UserMinus size={12} />
                          Demote to Passenger
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* PAGINATION */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
          <p className="text-slate-400">
            Page <span className="font-bold text-white">{page}</span> of{" "}
            <span className="font-bold text-white">{pagination.totalPages}</span>{" "}
            ({pagination.total} registered users)
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM ROLE CHANGE MODAL */}
      {pendingRoleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/30">
              <Shield size={24} />
            </div>

            <h3 className="mt-4 text-base font-bold text-white">
              Confirm Role Escalation / Update
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Are you sure you want to change the role of{" "}
              <strong className="text-white">{pendingRoleChange.user.name}</strong> (
              <span className="text-blue-400">{pendingRoleChange.user.email}</span>) to{" "}
              <strong className="text-purple-300 uppercase">
                {pendingRoleChange.targetRole === "admin" ? "Administrator" : "Passenger"}
              </strong>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingRoleChange(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmRoleChange}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Confirm Role Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
