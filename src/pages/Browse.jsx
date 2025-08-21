// src/pages/Browse.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import UserCard from "../components/UserCard";
import { likeUser, fetchAlreadyLikedUids } from "../services/match";

export default function Browse() {
  const { user } = useAuth();
  const myUid = user?.uid;
  const [profiles, setProfiles] = useState([]);
  const [hidden, setHidden] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        setError("");
        setLoading(true);

        const prev = await fetchAlreadyLikedUids();
        if (!alive) return;

        const snap = await getDocs(collection(db, "users"));
        if (!alive) return;
        const rows = [];
        snap.forEach((d) => rows.push(d.data()));

        const filtered = rows.filter((u) => {
          const count = Array.isArray(u.photos) ? u.photos.length : 0;
          return u.uid && u.uid !== myUid && !prev.has(u.uid) && count >= 3;
        });

        setProfiles(filtered);
      } catch (e) {
        console.error(e);
        setError(
          e?.message?.includes("Missing or insufficient permissions")
            ? "We can’t load profiles due to Firestore permissions. Please verify and publish your rules."
            : "Unable to load profiles. Please try again."
        );
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (myUid) run();
    return () => { alive = false; };
  }, [myUid]);

  async function handleLike(targetUid) {
    try {
      const res = await likeUser(targetUid);
      setHidden((s) => new Set(s).add(targetUid));
      if (res.status === "matched") alert("🎉 It's a match!");
    } catch (e) { alert(e.message); }
  }
  const handleSkip = (uid) => setHidden((s) => new Set(s).add(uid));
  const visible = useMemo(() => profiles.filter((p) => !hidden.has(p.uid)), [profiles, hidden]);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Browse</h2>
        <small className="text-muted">
          {loading ? "Loading…" : `${visible.length} profile(s)`}
        </small>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!error && visible.length === 0 && !loading ? (
        <div className="alert alert-light">No more profiles for now.</div>
      ) : (
        <div className="row g-3">
          {visible.map((u) => (
            <div className="col-12 col-sm-6 col-lg-4" key={u.uid}>
              <UserCard user={u} onLike={handleLike} onSkip={handleSkip} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
