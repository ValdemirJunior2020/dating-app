import React, { useEffect, useState } from "react";
import { fetchUserMatches } from "../services/match";
import { Link } from "react-router-dom";
import Lightbox from "../components/Lightbox";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);
  const [photos, setPhotos] = useState([]);

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

  function openZoom(allPhotos, idx = 0) {
    const arr = (Array.isArray(allPhotos) ? allPhotos : []).map((p) => (typeof p === "string" ? p : p?.url)).filter(Boolean);
    setPhotos(arr);
    setStart(idx);
    setOpen(true);
  }

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
      <div className="row g-4">
        {matches.map((m) => {
          const primary = (Array.isArray(m.photos) ? (typeof m.photos[0] === "string" ? m.photos[0] : m.photos[0]?.url) : m.photoURL) || "/default-avatar.png";
          const mPhotos = Array.isArray(m.photos) ? m.photos : [primary];

          return (
            <div key={m.id} className="col-md-6 col-lg-4">
              <div className="card shadow-sm" style={{ border: "none", borderRadius: 20 }}>
                <div className="d-flex justify-content-center pt-3">
                  <div
                    onClick={() => openZoom(mPhotos, 0)}
                    title="Click to enlarge"
                    style={{
                      width: 160,
                      height: 160,
                      borderRadius: "50%",         // circle
                      overflow: "hidden",
                      cursor: "zoom-in",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                    }}
                  >
                    <img
                      src={primary}
                      alt={m.name || "Match"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                </div>

                <div className="card-body text-center">
                  <h5 className="card-title brand-cursive">{m.name || "Unknown"}</h5>
                  <p className="mb-3" style={{ color: "var(--text-light)" }}>{m.city || ""}</p>
                  <div className="d-flex justify-content-center gap-2">
                    <Link to={`/chat/${m.id}`} className="btn btn-primary btn-sm">Open Chat</Link>
                    <Link to={`/profile/${m.id}`} className="btn btn-outline-light btn-sm">View Profile</Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {open && <Lightbox photos={photos} start={start} onClose={() => setOpen(false)} />}
    </div>
  );
}
