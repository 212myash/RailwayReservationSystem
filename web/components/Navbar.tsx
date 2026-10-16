
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowRight,
  ChevronDown,
  CircleUserRound,
  Home,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Ticket,
  TrainFront,
  UserRound,
  X,
} from "lucide-react";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

const navigation = [
  {
    label: "Home",
    href: "/",
    Icon: Home,
    action: "home",
  },
  {
    label: "Find Trains",
    href: "/#plan-your-trip",
    Icon: TrainFront,
    action: "plan",
  },
  {
    label: "Stations",
    href: "/#plan-your-trip",
    Icon: MapPin,
    action: "plan",
  },
  {
    label: "My Bookings",
    href: "/bookings",
    Icon: Ticket,
    action: "bookings",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      setLoadingUser(true);

      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        const data = await response.json();

        if (!active) return;

        if (response.ok && data.success && data.user) {
          setUser(data.user as SessionUser);
        } else {
          setUser(null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoadingUser(false);
      }
    }

    void loadSession();

    function handleFocus() {
      void loadSession();
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, [pathname]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Logout failed");
      }

      setUser(null);
      setProfileOpen(false);
      setMobileOpen(false);
      router.replace("/");
      router.refresh();
    } catch {
      window.alert(
        "Unable to log out right now. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  const accountHref = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <>
      <style jsx global>{`
        @keyframes nav-shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }

        @keyframes nav-glow {
          0%, 100% { opacity: .25; }
          50% { opacity: .65; }
        }

        @keyframes nav-drop {
          from { opacity: 0; transform: translateY(-7px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .nav-shimmer {
          animation: nav-shimmer 1.1s ease;
        }

        .nav-glow {
          animation: nav-glow 4s ease-in-out infinite;
        }

        .nav-drop {
          animation: nav-drop .18s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .nav-shimmer, .nav-glow, .nav-drop {
            animation: none !important;
          }
        }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

        <nav
          aria-label="Main navigation"
          className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
        >
          {/* BRAND */}
          <Link
            href="/"
            className="group relative flex shrink-0 items-center gap-3"
            aria-label="RailConnect home"
          >
            <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg shadow-blue-700/25 transition duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-4deg] group-hover:shadow-blue-500/40">
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:nav-shimmer" />
              <ArrowDownRight
                size={26}
                strokeWidth={2.6}
                className="relative transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>

            <span className="min-w-0">
              <span className="block text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                Rail<span className="text-blue-700">Connect</span>
              </span>
              <span className="hidden text-[9px] font-bold uppercase tracking-[0.19em] text-slate-500 sm:block">
                Your journey, simplified
              </span>
            </span>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1.5 lg:flex">
            {navigation.map(({ label, href, Icon }) => {
              const active =
                href === "/"
                  ? pathname === "/"
                  : pathname === href ||
                    pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={label}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition duration-200 ${
                    active
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/70"
                      : "text-slate-600 hover:bg-white hover:text-blue-700 hover:shadow-sm"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.3 : 1.8}
                    className="transition-transform duration-200 group-hover:-translate-y-0.5"
                  />
                  {label}
                  {active && (
                    <span className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ACCOUNT ACTIONS */}
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {loadingUser ? (
              <div
                aria-label="Loading account"
                className="h-11 w-28 animate-pulse rounded-xl bg-slate-100"
              />
            ) : user ? (
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  className={`group flex items-center gap-2.5 rounded-2xl border px-2.5 py-2 transition duration-200 ${
                    profileOpen
                      ? "border-blue-200 bg-blue-50/80 shadow-sm"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 ring-1 ring-blue-200/70">
                    <CircleUserRound size={21} />
                  </span>

                  <span className="max-w-28 text-left">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {user.name}
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-500">
                      {user.role === "admin" ? "Administrator" : "Passenger"}
                    </span>
                  </span>

                  <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div
                    role="menu"
                    className="nav-drop absolute right-0 top-[calc(100%+12px)] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_-25px_rgba(15,23,42,0.35)]"
                  >
                    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                      <p className="truncate font-bold text-slate-900">
                        {user.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                    </div>

                    <div className="my-2 h-px bg-slate-100" />

                    <Link
                      href={accountHref}
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <UserRound size={18} />
                      My dashboard
                    </Link>

                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <CircleUserRound size={18} />
                      My profile
                    </Link>

                    <Link
                      href="/bookings"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Ticket size={18} />
                      My bookings
                    </Link>

                    <Link
                      href="/settings"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Settings size={18} />
                      Account settings
                    </Link>

                    <div className="my-2 h-px bg-slate-100" />

                    <button
                      type="button"
                      role="menuitem"
                      disabled={loggingOut}
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      <LogOut size={18} />
                      {loggingOut ? "Logging out..." : "Log out"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md hover:shadow-blue-900/5"
                >
                  <LogIn size={16} />
                  Login
                </Link>

                <Link
                  href="/register"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-700/25"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:nav-shimmer" />
                  <span className="relative">Register</span>
                  <ArrowRight size={16} className="relative transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="flex items-center gap-2 sm:hidden">
            {user && (
              <Link
                href={accountHref}
                aria-label="Open dashboard"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700"
              >
                <CircleUserRound size={21} />
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </nav>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="nav-drop border-t border-slate-200/80 bg-white/95 px-4 pb-5 pt-3 shadow-xl backdrop-blur-xl sm:hidden">
            <div className="mx-auto max-w-7xl space-y-1">
              {navigation.map(({ label, href, Icon }) => {
                const active =
                  href === "/"
                    ? pathname === "/"
                    : pathname === href ||
                      pathname.startsWith(`${href}/`);

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                    }`}
                  >
                    <Icon size={19} />
                    {label}
                    {active && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </Link>
                );
              })}

              <div className="my-3 h-px bg-slate-100" />

              {loadingUser ? (
                <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
              ) : user ? (
                <>
                  <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href={accountHref}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50"
                  >
                    <UserRound size={18} />
                    My dashboard
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50"
                  >
                    <CircleUserRound size={18} />
                    My profile
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50"
                  >
                    <Settings size={18} />
                    Account settings
                  </Link>

                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    <LogOut size={18} />
                    {loggingOut ? "Logging out..." : "Log out"}
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-700"
                  >
                    <LogIn size={16} />
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-3 py-3 text-sm font-bold text-white"
                  >
                    Register
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
