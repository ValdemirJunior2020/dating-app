// src/components/InterestsSelector.jsx
import React, { useMemo, useRef, useState } from "react";

/** Default suggestion pool */
const DEFAULT_SUGGESTIONS = [
  "Study Sessions","Coding","AI/ML","Design","Entrepreneurship","Basketball","Soccer","Gym",
  "Running","Yoga","Gaming","Esports","Anime","Photography","Content Creation","Music","Guitar",
  "Piano","Singing","Podcasts","Volunteering","Campus Events","Movies","Cooking","Travel",
  "Coffee","Pets","Language Exchange","Board Games","Reading","Faith","Bible","Outdoors",
];

/** Keep letters/numbers and a few symbols; collapse spaces */
function sanitizeTag(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\-\s&'!?.]/gu, "")
    .trim();
}

/**
 * Props:
 *  - value?: string[]
 *  - onChange?: (string[]) => void
 *  - suggestions?: string[]
 *  - max?: number
 *  - placeholder?: string
 */
export default function InterestsSelector({
  value = [],
  onChange = () => {},
  suggestions = DEFAULT_SUGGESTIONS,
  max = 30,
  placeholder = "Search or press Enter to add…",
}) {
  const sel = useMemo(
    () => new Set((value || []).map((s) => sanitizeTag(s)).filter(Boolean)),
    [value]
  );

  const [search, setSearch] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [otherVal, setOtherVal] = useState("");
  const [error, setError] = useState("");
  const otherInputRef = useRef(null);

  function setSelected(nextSet) {
    onChange([...nextSet]);
  }

  function toggle(tag) {
    const t = sanitizeTag(tag);
    if (!t) return;
    const next = new Set(sel);
    if (next.has(t)) next.delete(t);
    else if (next.size < max) next.add(t);
    setSelected(next);
  }

  /** Add from the top search input */
  function addFromSearch() {
    setError("");
    const t = sanitizeTag(search);
    if (!t) return;
    if (t.length < 2) return setError("Make it at least 2 characters.");
    if (t.length > 40) return setError("Keep it under 40 characters.");
    const next = new Set(sel);
    if (next.size >= max) return setError(`You can pick up to ${max}.`);
    next.add(t);
    setSelected(next);
    setSearch("");
  }

  /** Handle Enter on the search input without using a <form> */
  function onSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addFromSearch();
    }
  }

  function openOther() {
    setShowOther(true);
    setOtherVal("");
    setError("");
    setTimeout(() => otherInputRef.current?.focus(), 0);
  }

  function cancelOther() {
    setShowOther(false);
    setOtherVal("");
    setError("");
  }

  function confirmOther() {
    setError("");
    const t = sanitizeTag(otherVal);
    if (!t) return setError("Type something first.");
    if (t.length < 2) return setError("Make it at least 2 characters.");
    if (t.length > 40) return setError("Keep it under 40 characters.");
    const next = new Set(sel);
    if (next.size >= max) return setError(`You can pick up to ${max}.`);
    next.add(t);
    setSelected(next);
    setShowOther(false);
    setOtherVal("");
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const pool = [...new Set([...suggestions, ...sel])];
    return q ? pool.filter((s) => s.toLowerCase().includes(q)) : pool;
  }, [search, suggestions, sel]);

  return (
    <div>
      {/* Top search / add row (NO <form>) */}
      <div className="d-flex align-items-center gap-2">
        <input
          className="form-control"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={onSearchKeyDown}
        />
        <button
          type="button"
          className="btn btn-primary fw-bold"
          onClick={addFromSearch}
          disabled={!search.trim()}
          title="Add as a custom interest"
        >
          Add
        </button>
      </div>

      <div className="d-flex align-items-center justify-content-between mt-2">
        <div className="small text-muted fw-bold">{sel.size}/{max}</div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary rounded-pill fw-bold"
          onClick={openOther}
          disabled={sel.size >= max}
        >
          + Other…
        </button>
      </div>

      {/* Inline “Other” panel (NO <form>) */}
      {showOther && (
        <div
          className="card mt-2"
          style={{
            padding: 10,
            borderRadius: 12,
            background: "rgba(0,0,0,0.03)",
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <label className="form-label mb-1">Add a custom interest</label>
          <div className="d-flex" style={{ gap: 8 }}>
            <input
              ref={otherInputRef}
              className="form-control"
              placeholder="Type here (e.g., Candle Making)"
              value={otherVal}
              onChange={(e) => setOtherVal(e.target.value)}
              maxLength={40}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmOther();
                }
              }}
            />
            <button type="button" className="btn btn-primary fw-bold" onClick={confirmOther}>
              Add
            </button>
            <button type="button" className="btn btn-outline-secondary fw-bold" onClick={cancelOther}>
              Cancel
            </button>
          </div>
          {error && <div className="text-danger mt-2 fw-bold">{error}</div>}
        </div>
      )}

      {/* Suggestions grid with visible chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} className="mt-3">
        {visible.map((tag) => {
          const on = sel.has(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`btn btn-sm rounded-pill ${on ? "btn-primary" : "btn-outline-secondary"}`}
              style={{ fontWeight: 800 }}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
