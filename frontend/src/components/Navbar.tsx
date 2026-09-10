import {
  Bell,
  Bot,
  Building2,
  CalendarDays,
  FlaskConical,
  Home,
  LineChart,
  Newspaper,
  Scale,
  Brain,
  User,
  FileDown,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const navigation = [
  {
    name: "Dashboard",
    path: "/",
    icon: Home,
  },
  {
    name: "Stocks",
    path: "/stocks",
    icon: LineChart,
  },
  {
    name: "Watchlist",
    path: "/watchlist",
    icon: LineChart,
  },
  {
    name: "News",
    path: "/news",
    icon: Newspaper,
  },
  {
    name: "Calendar",
    path: "/calendar",
    icon: CalendarDays,
  },
  {
    name: "Intelligence",
    path: "/intelligence",
    icon: Brain,
  },
  {
    name: "Companies",
    path: "/companies",
    icon: Building2,
  },
  {
    name: "Compare",
    path: "/compare",
    icon: Scale,
  },
  {
    name: "AI",
    path: "/ai",
    icon: Bot,
  },
  {
    name: "Alerts",
    path: "/alerts",
    icon: Bell,
  },
  {
    name: "Simulator",
    path: "/simulator",
    icon: FlaskConical,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: User,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileDown,
  },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3">
        {/* FinPilot Logo */}
        <NavLink
          to="/"
          className="flex shrink-0 items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg">
            F
          </div>

          <div className="hidden xl:block">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              FinPilot
            </p>

            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Stock Intelligence
            </p>
          </div>
        </NavLink>

        {/* Navigation */}
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-hide">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition",
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
                  ].join(" ")
                }
              >
                <Icon size={16} strokeWidth={2} />

                <span className="hidden 2xl:inline">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right-side controls */}
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle
            darkMode={false}
            onToggle={() => {}}
          />

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell size={17} />
          </button>

          <NavLink
            to="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label="Profile"
          >
            <User size={17} />
          </NavLink>
        </div>
      </div>
    </header>
  );
}