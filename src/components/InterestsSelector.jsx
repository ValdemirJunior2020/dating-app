// src/components/InterestsSelector.jsx
import React, { useMemo, useRef, useState } from "react";

export const INTEREST_CATALOG = [
  // Campus / Study / Tech
  "Study Sessions","Coding","AI/ML","Design","Entrepreneurship","Startups",
  "Hackathons","Open Source","Robotics","Math","Physics","Chemistry","Biology",
  "Economics","Finance","Marketing","Psychology","Philosophy",

  // Sports & Fitness
  "Basketball","Soccer","Gym","Running","Yoga","Pilates","Swimming","Hiking",
  "Tennis","Pickleball","Cycling","Martial Arts",

  // Gaming / Anime
  "Gaming","Esports","Anime","Manga","Tabletop RPG","Board Games","Chess",

  // Arts & Media
  "Photography","Content Creation","Music","Guitar","Piano","Singing","DJing",
  "Podcasts","Movies","Filmmaking","Theater","Poetry","Writing","Reading",

  // Social
  "Volunteering","Campus Events","Travel","Cooking","Baking","Coffee","Tea",
  "Pets","Language Exchange","Outdoors","Camping","Beach",

  // Faith (Christian)
  "Faith","Bible Study","Prayer","Church","Worship Music","Christian Podcasts",
  "Youth Ministry","Mission Trips","Apologetics","Christian Fellowship",
  "Devotionals","Christian Books","Theology",

  // Christian values / lifestyle
  "Kindness","Service","Charity","Community","Forgiveness","Humility",
  "Stewardship","Chastity","Sobriety",

  // Politics (neutral labels)
  "Politics","Conservative","Liberal","Moderate","Libertarian","Independent",
  "Non-Political","Civic Engagement",
];

const DEFAULT_SUGGESTIONS = INTEREST_CATALOG;

function sanitizeTag(s) {
  return String(s || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    // Allow letters (incl. extended Latin), numbers, spaces, and & ' ! ? . -
    .replace(/[^0-9A-Za-z\u00C0-\u024F\u1E00-\u1EFF &'!?.-]/g, "")
    .trim();
}

export default function InterestsSelector({
  value = [],
  onChange = () => {},
  suggestions = DEFAULT_SUGGESTIONS,
  max = 30,
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

  function addFromInput(e) {
    e.preventDefault();
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

  function confirmOther(e) {
    e?.preventDefault?.();
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
      {/* Search/Add bar */}
      <form onSubmit={addFromInput}>
        <input
          className="form-control"
          placeholder="Search or press Enter to add…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <div className="d-flex align-items-center justify-content-between mt-2">
        <div className="small text-white-50 fw-bold">{sel.size}/{max}</div>
        <button
          type="button"
          className="btn btn-sm btn-warning rounded-pill fw-bold"
          onClick={openOther}
          disabled={sel.size >= max}
        >
          + Other…
        </button>
      </div>

      {showOther && (
        <form
          onSubmit={confirmOther}
          className="card mt-2"
          style={{
            padding: 10,
            borderRadius: 12,
            background: "rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.35)",
          }}
        >
          <label className="form-label mb-1">Add a custom interest</label>
          <div className="d-flex" style={{ gap: 8 }}>
            <input
              ref={otherInputRef}
              className="form-control"
              placeholder="Type here (e.g., Bible Study Group)"
              value={otherVal}
              onChange={(e) => setOtherVal(e.target.value)}
              maxLength={40}
            />
            <button type="submit" className="btn btn-primary fw-bold">
              Add
            </button>
            <button type="button" className="btn btn-outline-light fw-bold" onClick={cancelOther}>
              Cancel
            </button>
          </div>
          {error && <div className="text-danger mt-2 fw-bold">{error}</div>}
        </form>
      )}

      {/* Suggestions grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} className="mt-3">
        {visible.map((tag) => {
          const on = sel.has(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`btn btn-sm rounded-pill ${on ? "btn-warning" : "btn-outline-light"}`}
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
