// src/components/InterestsSelector.jsx
import { useEffect, useMemo, useState } from "react";

const DEFAULT_PRESET = [
  "Study Sessions", "Coding", "AI/ML", "Design", "Entrepreneurship",
  "Basketball", "Soccer", "Gym", "Running", "Yoga",
  "Gaming", "Esports", "Anime", "Photography", "Content Creation",
  "Music", "Guitar", "Piano", "Singing", "Podcasts",
  "Volunteering", "Campus Events", "Movies", "Cooking", "Travel",
  "Coffee", "Pets", "Language Exchange", "Board Games", "Reading"
];

export default function InterestsSelector({
  value = [],
  onChange = () => {},
  preset = DEFAULT_PRESET,
  max = 12
}) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return preset;
    return preset.filter(p => p.toLowerCase().includes(q));
  }, [query, preset]);

  const toggle = (tag) => {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else if (max <= 0 || next.size < max) next.add(tag);
    onChange(Array.from(next));
  };

  useEffect(() => {
    if (value.length !== new Set(value).size) {
      onChange(Array.from(new Set(value)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          placeholder="Search interests…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--elev)",
            color: "var(--text)"
          }}
        />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {value.length}/{max > 0 ? max : "∞"}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {filtered.map((tag) => {
          const active = selected.has(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: active ? "var(--link)" : "var(--card)",
                color: active ? "#0b1220" : "var(--text)",
                cursor: "pointer"
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8,
          paddingTop: 6, borderTop: "1px dashed var(--border)"
        }}>
          {value.map(tag => (
            <span
              key={tag}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                background: "var(--elev)",
                border: "1px solid var(--border)",
                fontSize: 13
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
