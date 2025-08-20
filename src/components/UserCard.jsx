// src/components/UserCard.jsx
import React from "react";

export default function UserCard({ user, onLike, onSkip }) {
  const { uid, name, age, city, interests = "", lookingFor = "" } = user;

  const chips = String(interests)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  return (
    <div className="card card-soft h-100">
      <div className="card-body">
        {/* Avatar initials */}
        <div className="d-flex align-items-center mb-3">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle me-3"
            style={{ width: 48, height: 48, fontWeight: 700 }}
          >
            {String(name || "?").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="h6 mb-0">
              {name || "Anonymous"} {age ? `· ${age}` : ""}
            </div>
            <small className="text-muted">{city || "Somewhere"}</small>
          </div>
        </div>

        {lookingFor && (
          <span className="badge text-bg-light border mb-2">{lookingFor}</span>
        )}

        {chips.length > 0 && (
          <div className="mt-2">
            {chips.map((c, i) => (
              <span key={i} className="badge text-bg-secondary me-1 mb-1">
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="d-grid gap-2 mt-3">
          <button className="btn btn-primary btn-lg" onClick={() => onLike(uid)}>
            Like
          </button>
          <button className="btn btn-outline-secondary" onClick={() => onSkip(uid)}>
            Pass
          </button>
        </div>
      </div>
    </div>
  );
}
