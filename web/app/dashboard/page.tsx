
"use client";

import Link from "next/link";
import {
  ArrowRight,
  TrainFront,
  Ticket,
  MapPin,
  Clock,
  UserRound,
} from "lucide-react";

const quickLinks = [
  {
    title: "Find Trains",
    description: "Search trains between stations.",
    href: "/trains",
    icon: TrainFront,
  },
  {
    title: "My Bookings",
    description: "View and manage your reservations.",
    href: "/bookings",
    icon: Ticket,
  },
  {
    title: "Stations",
    description: "Explore available railway stations.",
    href: "/stations",
    icon: MapPin,
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-800 p-7 text-white sm:p-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                Passenger dashboard
              </p>

              <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                Welcome to RailConnect
              </h1>

              <p className="mt-4 max-w-xl leading-7 text-blue-100">
                Your railway journey starts here. Search trains, explore
                stations and manage your reservations from one place.
              </p>

              <Link
                href="/trains"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-blue-900 transition hover:bg-blue-50"
              >
                Find a train
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="hidden rounded-3xl border border-white/15 bg-white/10 p-7 text-white sm:block">
              <TrainFront size={76} strokeWidth={1.3} />
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-slate-900">
              Your travel overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your booking information will appear here when connected.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Ticket size={23} />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">
                Total bookings
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">—</p>
              <p className="mt-2 text-xs text-slate-400">
                Booking data not connected yet
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Clock size={23} />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">
                Upcoming journeys
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">—</p>
              <p className="mt-2 text-xs text-slate-400">
                Journey data not connected yet
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <UserRound size={23} />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">
                Account status
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                Signed in
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Login completed successfully
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-extrabold text-slate-900">
            Quick actions
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose what you want to do next.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/60"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                      <Icon size={23} />
                    </div>
                    <ArrowRight
                      size={19}
                      className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700"
                    />
                  </div>

                  <h3 className="mt-5 font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
