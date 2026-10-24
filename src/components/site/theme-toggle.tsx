"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "@/components/ui/icons";

export const THEME_STORAGE_KEY = "fw-theme";
export const THEME_EVENT = "fw-theme-change";

export function applyTheme(dark: boolean, persist: boolean): void {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // Storage can be unavailable in private modes; the toggle still works.
    }
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(next, true);
    setDark(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn("icon-btn relative", className)}
      aria-label={dark ? "切换到浅色模式" : "切换到深色模式"}
      title={dark ? "切换到浅色模式" : "切换到深色模式"}
    >
      <span className="relative block size-[18px]">
        <span
          className={cn(
            "absolute inset-0 transition-all duration-300",
            mounted && dark ? "scale-75 opacity-0" : "scale-100 opacity-100",
          )}
        >
          <Moon size={18} />
        </span>
        <span
          className={cn(
            "absolute inset-0 transition-all duration-300",
            mounted && dark ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
        >
          <Sun size={18} />
        </span>
      </span>
    </button>
  );
}
