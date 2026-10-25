"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function setThemeClass(t: Theme) {
  const el = document.documentElement;
  el.setAttribute("data-theme", t);
  el.classList.toggle("dark", t === "dark");
  try {
    localStorage.setItem("opal-theme", t);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    setThemeClass(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return (
    <button className="ib" aria-label="Toggle theme" onClick={toggle}>
      {theme === "dark" ? <Sun className="lucide" /> : <Moon className="lucide" />}
    </button>
  );
}
