"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  TrainFront,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Login failed. Please try again.");
        return;
      }

      // Verify that the session cookie is working.
      const sessionResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok || !sessionData.success || !sessionData.user) {
        setError(
          "Login succeeded, but your session could not be verified. Please try again."
        );
        return;
      }

      // Restore the original destination when login was required for booking.
      const query = new URLSearchParams(window.location.search);
      const requestedRedirect = query.get("redirect");

      const isSafeInternalPath =
        requestedRedirect !== null &&
        requestedRedirect.startsWith("/") &&
        !requestedRedirect.startsWith("//") &&
        !requestedRedirect.includes("\\") &&
        !requestedRedirect.includes("\0");

      // Only allow the booking page as a return destination.
      const bookingRedirect =
        isSafeInternalPath && requestedRedirect.startsWith("/booking")
          ? requestedRedirect
          : null;

      const destination =
        bookingRedirect ??
        (sessionData.user.role === "admin" ? "/admin" : "/dashboard");

      // Full navigation refreshes the navbar and reads the new session.
      window.location.replace(destination);
    } catch (error) {
      console.error("Login page error:", error);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full border border-white/10" />

          <Link
            href="/"
            className="relative z-10 inline-flex items-center gap-3"
          >
            <div className="rounded-xl bg-white/10 p-3">
              <TrainFront size={28} />
            </div>
            <div>
              <p className="text-xl font-extrabold">RailConnect</p>
              <p className="text-xs text-blue-200">
                Railway Reservation System
              </p>
            </div>
          </Link>

          <div className="relative z-10 max-w-lg">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
              Your journey starts here
            </p>
            <h1 className="mt-5 text-5xl font-black leading-tight">
              Every journey,
              <br />
              one connection.
            </h1>
            <p className="mt-5 max-w-md leading-7 text-blue-100">
              Sign in to manage your journeys, review your reservations and
              keep your travel details in one place.
            </p>

            <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4">
              <ShieldCheck size={26} className="shrink-0 text-blue-200" />
              <div>
                <p className="font-semibold">Your account, your journeys</p>
                <p className="mt-1 text-sm text-blue-100">
                  Access to your bookings requires secure authentication.
                </p>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-sm text-blue-200">
            RailConnect · Railway Reservation System
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"
            >
              <ArrowLeft size={17} />
              Back to home
            </Link>

            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-700 p-3 text-white">
                  <TrainFront size={25} />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900">
                    RailConnect
                  </p>
                  <p className="text-xs text-slate-500">
                    Railway Reservation System
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
                Welcome back
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Sign in to your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your account details to continue to your journeys.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    maxLength={72}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">
                NEW TO RAILCONNECT?
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
              href="/register"
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
            >
              Create a user account
            </Link>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Sign in to continue to your RailConnect account.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
