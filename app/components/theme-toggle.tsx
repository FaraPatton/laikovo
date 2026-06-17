"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "laikovo-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = saved === "dark" || (!saved && prefersDark) ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  return (
    <button
      aria-label="Переключить тему"
      aria-pressed={theme === "dark"}
      className="theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      <Sun size={15} />
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb" />
      </span>
      <Moon size={15} />
    </button>
  );
}
