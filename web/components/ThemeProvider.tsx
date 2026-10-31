"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((targetTheme: Theme) => {
    const root = document.documentElement;
    let effectiveDark = false;

    if (targetTheme === "system") {
      effectiveDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      effectiveDark = targetTheme === "dark";
    }

    if (effectiveDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    setResolvedTheme(effectiveDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedTheme = (localStorage.getItem("railconnect_theme") as Theme) || "system";
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } catch {
        applyTheme("system");
      }
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [applyTheme]);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem("railconnect_theme", newTheme);
    } catch {
      // Storage unavailable or blocked
    }
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
