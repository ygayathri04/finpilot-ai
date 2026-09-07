import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  darkMode: boolean;
  onToggle: () => void;
};

export default function ThemeToggle({
  darkMode,
  onToggle,
}: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label={
        darkMode
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        darkMode
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      {darkMode ? (
        <Sun size={17} />
      ) : (
        <Moon size={17} />
      )}
    </button>
  );
}