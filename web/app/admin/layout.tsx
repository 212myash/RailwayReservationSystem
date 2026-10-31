"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import {
  Armchair,
  ArrowLeft,
  CalendarClock,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Shield,
  ShieldAlert,
  Ticket,
  TrainFront,
  Users,
  X,
} from "lucide-react";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

const adminNav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Trains", href: "/admin/trains", icon: TrainFront },
  { label: "Stations", href: "/admin/stations", icon: MapPin },
  { label: "Coach Compositions", href: "/admin/coach-configurations", icon: Armchair },
  { label: "Schedules", href: "/admin/schedules", icon: CalendarClock },
  { label: "Bookings", href: "/admin/bookings", icon: Ticket },
  { label: "Users", href: "/admin/users", icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();

        if (!active) return;

        if (res.ok && data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void checkAuth();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      window.alert("Logout failed. Please try again.");
    }
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-xs font-semibold tracking-wider text-slate-400">
            VERIFYING ADMIN PRIVILEGES...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated or Non-Admin Guard
  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-500/20 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 ring-1 ring-red-500/30">
            <ShieldAlert size={36} />
          </div>

          <h1 className="mt-5 text-2xl font-black tracking-tight text-white">
            Access Denied
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            This protected console is restricted to RailConnect system administrators.
            {!user ? " You must log in with an administrator account to continue." : " Your account does not have administrator privileges."}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {!user ? (
              <Link
                href="/login?redirect=/admin"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Sign In as Administrator
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Return to Passenger Dashboard
              </Link>
            )}

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-700"
            >
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* MOBILE TOPBAR */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur-lg lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <Shield size={20} />
          </span>
          <span className="text-base font-black tracking-tight text-white">
            RailConnect <span className="text-blue-500">Admin</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <div className="flex">
        {/* DESKTOP SIDEBAR */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 p-4 lg:flex">
          {/* LOGO */}
          <div className="flex items-center gap-3 px-3 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
              <Shield size={22} />
            </span>
            <div>
              <span className="block text-base font-black tracking-tight text-white">
                Rail<span className="text-blue-500">Connect</span>
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-blue-400">
                Admin Console
              </span>
            </div>
          </div>

          <div className="my-3 h-px bg-slate-800/80" />

          {/* NAVIGATION LINKS */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto py-2">
            {adminNav.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Icon size={18} className={active ? "text-white" : "text-slate-400"} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="my-3 h-px bg-slate-800/80" />

          {/* ADMIN USER PROFILE & LOGOUT */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <CircleUserRound size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{user.name}</p>
                <p className="truncate text-[10px] text-slate-400">{user.email}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white"
              >
                <ArrowLeft size={13} />
                Public Site
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 p-6 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Shield size={20} />
                </span>
                <span className="text-base font-black text-white">Admin Console</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="mt-6 flex-1 space-y-2 overflow-y-auto">
              {adminNav.map(({ label, href, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-bold transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-slate-800 pt-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-3 text-xs font-bold text-slate-300"
              >
                <ArrowLeft size={16} />
                Return to Public Site
              </Link>
            </div>
          </div>
        )}

        {/* MAIN ADMIN CONTENT AREA */}
        <main className="min-h-screen flex-1 overflow-x-hidden bg-slate-900 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

