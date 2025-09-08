import { useEffect, useState } from "react";

/**
 * Simple, app-wide theme toggle.
 * - Stores preference in localStorage ("light" | "dark")
 * - Applies data-theme attribute to <html> so CSS can target [data-theme="dark"]
 * - Floating button, no changes to NavBar or routes required
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        position: "fixed",
        right: "16px",
        bottom: "16px",
        zIndex: 9999,
        padding: "10px 14px",
        borderRadius: "999px",
        border: "1px solid var(--border)",
        background: "var(--elev)",
        color: "var(--text)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
        cursor: "pointer"
      }}
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
