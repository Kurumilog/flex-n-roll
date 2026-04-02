"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type ThemePreference = "light" | "dark" | "system";
type Theme = "light" | "dark";

const STORAGE_KEY = "flexnroll-theme";

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  isSystem: boolean;
  setPreference: (theme: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }

    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    if (preference === "system") {
      return getSystemTheme();
    }

    return preference;
  });

  useEffect(() => {
    if (preference === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        setResolvedTheme(media.matches ? "dark" : "light");
      };

      handleChange();
      media.addEventListener("change", handleChange);

      return () => {
        media.removeEventListener("change", handleChange);
      };
    }

    setResolvedTheme(preference);
    window.localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedTheme,
      preference,
      isSystem: preference === "system",
      setPreference,
      toggleTheme: () => {
        setPreference(resolvedTheme === "dark" ? "light" : "dark");
      },
    }),
    [preference, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }

  return context;
}
