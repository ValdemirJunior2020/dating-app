// src/pages/PublicProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function firstPhotoFrom(user) {
  const photos = Array.isArray(user?.photos) ? user.photos : [];
  const first = photos.find((p) => typeof p === "string" && p);
  return first || user?.photoURL || null;
}

// 🔒 Robust: array | comma-string | object map -> string[]
function normalizeInterests(x) {
  if (Array.isArray(x)) {
    return x.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof x === "string") {
    return x
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (x && typeof x === "object") {
    return Object.keys(x).filter((k) => Boolean(x[k]));
  }
  return [];
}

export default function PublicProfile() {
  const { uid } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Realtime so profile updates immediately after edits
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setUser(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid]);

  const photo = useMemo(() => firstPhotoFrom(user), [user]);
  const tags = useMemo(() => normalizeInterests(user?.interests), [user]);

  if (loading) {
    return (
      <div className="container text-white" style={{ padding: 16 }}>
        Loading…
      </div>
    );
  }
  if (!user) {
    return (
      <div className="container text-white" style={{ padding: 16 }}>
        User not found.
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: 16, maxWidth: 720 }}>
      <div
        className="card p-3"
        style={{
          background: "rgba(0,0,0,.25)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,.3)",
        }}
      >
        <div className="d-flex align-items-center gap-3">
          {/* Circular avatar + enlarge */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              overflow: "hidden",
              flex: "0 0 auto",
              border: "3px solid rgba(255,255,255,.6)",
              background: "#1b1b1b",
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt={user.displayName || "profile"}
                data-enlarge
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  cursor: "zoom-in",
                }}
              />
            ) : (
              <div className="text-white-50 d-flex align-items-center justify-content-center h-100">
                No photo
              </div>
            )}
          </div>

          <div>
            <h3 className="text-white mb-1">
              {user.displayName || user.name || "Someone"}
            </h3>
            {user.age && (
              <div className="text-white-50 fw-bold">{user.age}</div>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="mt-3">
          <div className="text-white-50 fw-bold mb-2">Interests</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tags.length ? (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="badge rounded-pill"
                  style={{
                    background: "#dff3ff",
                    color: "#153e52",
                    fontWeight: 800,
                  }}
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-white-50">No interests yet</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
