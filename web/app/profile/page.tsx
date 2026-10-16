
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  Mail,
  ShieldCheck,
  CalendarDays,
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.user) {
          router.replace("/login?redirect=%2Fprofile");
          return;
        }

        if (active) {
          setUser(data.user);
        }
      } catch {
        if (active) {
          setError("Profile load nahi ho paya. Dobara try karo.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchProfile();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading profile...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-8 text-white sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                <UserRound className="h-8 w-8" />
              </div>

              <div>
                <h1 className="text-2xl font-bold">My Profile</h1>
                <p className="mt-1 text-sm text-blue-100">
                  View your RailConnect account details
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Personal Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                  <UserRound className="h-4 w-4" />
                  Full Name
                </div>
                <p className="break-words font-semibold text-slate-900">
                  {user.name}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
                <p className="break-words font-semibold text-slate-900">
                  {user.email}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                  <ShieldCheck className="h-4 w-4" />
                  Account Type
                </div>
                <p className="font-semibold capitalize text-slate-900">
                  {user.role}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  Account ID
                </div>
                <p className="break-all font-mono text-sm text-slate-700">
                  {user.id}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
              Profile editing aur password management hum next step mein add
              karenge.
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/settings")}
                className="rounded-xl bg-blue-700 px-5 py-3 font-medium text-white transition hover:bg-blue-800"
              >
                Account Settings
              </button>

              <button
                onClick={() => router.push("/bookings")}
                className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                My Bookings
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
