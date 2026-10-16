
import Link from "next/link";
import {
  ArrowUpRight,
  Home,
  MapPin,
  TrainFront,
  Ticket,
} from "lucide-react";

const exploreLinks = [
  { label: "Home", href: "/", Icon: Home },
  { label: "Find Trains", href: "/trains", Icon: TrainFront },
  { label: "Stations", href: "/stations", Icon: MapPin },
  { label: "My Bookings", href: "/bookings", Icon: Ticket },
];

const projectFeatures = [
  "Train search and sorting",
  "Seat reservation",
  "Booking history",
  "Railway DSA implementation",
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

      <div className="mx-auto max-w-7xl px-5 pb-6 pt-14 sm:px-8 sm:pt-16">
        <div className="grid gap-10 border-b border-slate-100 pb-10 md:grid-cols-[1.3fr_0.7fr_0.9fr] md:gap-14">
          {/* BRAND */}
          <div>
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-700/20 transition duration-300 group-hover:-translate-y-1 group-hover:rotate-[-4deg]">
                <ArrowUpRight size={26} strokeWidth={2.5} />
              </span>
              <span className="text-xl font-black tracking-tight text-slate-950">
                Rail<span className="text-blue-700">Connect</span>
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">
              Your journey, simplified. Explore train routes, manage
              reservations and plan your next journey with ease.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-800">
              <TrainFront size={15} />
              Railway Reservation System
            </div>
          </div>

          {/* EXPLORE */}
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              Explore
            </h2>

            <ul className="mt-5 space-y-3.5">
              {exploreLinks.map(({ label, href, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2.5 text-sm text-slate-500 transition hover:translate-x-1 hover:text-blue-700"
                  >
                    <Icon
                      size={16}
                      className="text-slate-400 transition group-hover:text-blue-700"
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* PROJECT FEATURES */}
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              Project features
            </h2>

            <ul className="mt-5 space-y-3.5">
              {projectFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2.5 text-sm text-slate-500"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} RailConnect. Academic project.
          </p>

          <p className="flex items-center gap-1.5">
            Built with
            <span className="font-semibold text-slate-600">Next.js</span>,
            <span className="font-semibold text-slate-600">TypeScript</span>
            and
            <span className="font-semibold text-slate-600">Tailwind CSS</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
