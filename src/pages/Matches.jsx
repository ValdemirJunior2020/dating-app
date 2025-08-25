// src/pages/Matches.jsx
import React, { useEffect, useState } from "react";
import { fetchUserMatches } from "../services/match";
import { Link } from "react-router-dom";

export default function Matches() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchUserMatches();
        setMatches(list);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      }
    })();
  }, []);

  if (!matches.length) {
    return (
      <div className="container py-4">
        <h2 className="mb-3">Matches</h2>
        <p className="text-light">No matches yet. Keep browsing!</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">Matches</h2>
      <div className="row g-3">
        {matches.map((m) => (
          <div key={m.id} className="col-md-4">
            <div className="card shadow-sm" style={{ backgroundColor: "var(--brown-800)" }}>
              <img
                src={m.photos?.[0] || m.photoURL || "/default-avatar.png"}
                alt={m.name || "Match"}
                className="card-img-top"
                style={{ objectFit: "cover", height: "200px" }}
              />
              <div className="card-body">
                <h5 className="card-title brand-cursive">{m.name || "Unknown"}</h5>
                <p className="mb-3" style={{ color: "var(--text-light)" }}>{m.city || ""}</p>
                <Link to={`/chat/${m.id}`} className="btn btn-primary btn-sm">
                  Open Chat
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
