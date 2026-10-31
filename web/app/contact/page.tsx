"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  HelpCircle,
  LifeBuoy,
  MapPin,
  Search,
  Send,
  TrainFront,
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      {/* HEADER BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 px-5 py-16 text-white sm:px-8 sm:py-24 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-200">
            <LifeBuoy size={16} />
            Support & Inquiries
          </div>

          <h1 className="mt-5 text-3xl font-black sm:text-5xl">
            How can we help you?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
            Have questions about RailConnect, need assistance with ticket verification,
            or exploring the academic project code? Reach out to our team.
          </p>
        </div>
      </section>

      {/* SELF-SERVICE QUICK SHORTCUTS */}
      <section className="mx-auto -mt-8 max-w-5xl px-5 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/pnr-status"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Search size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Track PNR</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Instant status lookup</p>
            </div>
          </Link>

          <Link
            href="/trains"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
              <TrainFront size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Find Trains</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">5,200+ passenger trains</p>
            </div>
          </Link>

          <Link
            href="/stations"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400">
              <MapPin size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Station Directory</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">9,063 railway stations</p>
            </div>
          </Link>
        </div>
      </section>

      {/* CONTACT FORM & DETAILS */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* LEFT: FORM */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {submitted ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
                  Message Transmitted
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                  Thank you for your feedback. In this demonstration environment, your message has been logged for academic review.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName("");
                    setEmail("");
                    setSubject("");
                    setMessage("");
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Send us a Message
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Have a question or bug report? Submit the form below.
                </p>

                <div>
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="E.g., Coach seat reservation question"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we assist you?"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <Send size={16} />
                  Submit Inquiry
                </button>
              </form>
            )}
          </div>

          {/* RIGHT: INFO & FAQ */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <HelpCircle size={20} className="text-blue-600 dark:text-blue-400" />
                Frequently Asked Inquiries
              </h3>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Is this an official IRCTC booking portal?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    No. RailConnect is an academic prototype created to evaluate modern web technologies, full-text station indexing, and C++ algorithmic ticket processing.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    How do I access administrator controls?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Authorized administrators can access the console via <Link href="/admin" className="font-semibold text-blue-600 underline dark:text-blue-400">/admin</Link>. An administrator session cookie is strictly required.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Where can I view the project source and documentation?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Full architectural documentation, testing reports, and setup guides are maintained in the root <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] text-slate-800 dark:bg-slate-800 dark:text-slate-200">docs/</code> directory.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-7 dark:border-blue-900/50 dark:bg-blue-950/30">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                Academic Project Repository
              </h3>
              <p className="mt-2 text-xs leading-5 text-blue-800/80 dark:text-blue-300/80">
                RailConnect Railway Reservation System includes automated test suites, Next.js web application, and C++ DSA verification tests.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
