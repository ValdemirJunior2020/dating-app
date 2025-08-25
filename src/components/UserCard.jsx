// src/components/UserCard.jsx
import React, { useState } from "react";
import Lightbox from "./Lightbox";
import { Link } from "react-router-dom";

const cleanPhotos = (arr) =>
  (Array.isArray(arr) ? arr : []).filter(
    (u) => typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"))
  );

export default function UserCard({ user, onLike }) {
  const photos = cleanPhotos(user.photos);
  const primary = photos[0] || user.photoURL || null;
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);

  return (
    <div className="card shadow-sm" style={{ backgroundColor: "var(--brown-800)" }}>
      <div style={{ position: "relative", cursor: primary ? "zoom-in" : "default" }}>
        {primary ? (
          <img
            src={primary}
            alt={user.name}
            className="card-img-top"
            style={{ objectFit: "cover", height: "260px" }}
            onClick={() => { setStart(0); setOpen(true); }}
          />
        ) : (
          <div
            className="d-flex align-items-center justify-content-center"
            style={{ height: "260px", background: "var(--brown-900)", color: "var(--text-light)" }}
          >
            No Photo
          </div>
        )}

        {photos.length > 1 && (
          <div className="position-absolute bottom-0 start-0 end-0 p-2 d-flex gap-1 justify-content-center">
            {photos.slice(0, 5).map((u, idx) => (
              <img
                key={u}
                src={u}
                alt=""
                onClick={(e) => { e.stopPropagation(); setStart(idx); setOpen(true); }}
                style={{
                  width: 48, height: 48, objectFit: "cover",
                  borderRadius: 6, border: "2px solid #fff", cursor: "zoom-in"
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="card-body">
        {/* Name in Candle Love cursive/amber */}
        <h5 className="mb-1 brand-cursive">
          {user.name} {user.age ? `• ${user.age}` : ""}
        </h5>

        {/* Location in light text */}
        <p className="mb-3" style={{ color: "var(--text-light)" }}>
          {user.city || ""}
        </p>

        <div className="d-flex gap-2">
          {user.matched ? (
            <Link to={`/chat/${user.matchId}`} className="btn btn-primary btn-sm">
              Open Chat
            </Link>
          ) : (
            <button className="btn btn-success btn-sm" onClick={() => onLike(user.uid)}>
              ❤️ Like
            </button>
          )}
        </div>
      </div>

      {open && <Lightbox photos={photos} start={start} onClose={() => setOpen(false)} />}
    </div>
  );
}
