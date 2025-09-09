// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";          // 👈 added
import { db } from "../firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import "./Landing.css";

// keep only valid Firebase download URLs
const cleanPhotos = (arr) =>
  (Array.isArray(arr) ? arr : []).filter(
    (u) => typeof u === "string" && u.includes("alt=media")
  );

// Simple shuffle
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Home() {
  const { currentUser } = useAuth() || {};                // 👈 added
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load up to ~120 recent public images (only when signed in)
  useEffect(() => {
    let alive = true;

    (async () => {
      // ✅ Do NOT call Firestore unless signed in
      if (!currentUser?.uid) {
        if (alive) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const q = query(
          collection(db, "public_photos"),
          orderBy("createdAt", "desc"),
          limit(150)
        );
        const snap = await getDocs(q);
        const arr = [];
        snap.forEach((d) => {
          const u = d.data()?.url;
          if (u) arr.push(u);
        });
        const valid = cleanPhotos(arr);
        if (alive) setUrls(shuffle(valid).slice(0, 120));
      } catch (e) {
        // Gracefully handle permission-denied or any other error
        console.error(e);
        if (alive) setUrls([]); // fall back to gradient
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [currentUser?.uid]);                                   // 👈 re-run after login

  const hasImages = useMemo(() => urls.length > 0, [urls]);

  return (
    <div className="landing-root">
      {/* Blurred mosaic background (only when we have URLs) */}
      {hasImages ? (
        <div className="mosaic" aria-hidden="true">
          {urls.map((u, i) => (
            <div
              className="mosaic-cell"
              key={`${u}-${i}`}
              style={{ backgroundImage: `url(${u})` }}
            />
          ))}
        </div>
      ) : (
        <div className="mosaic-fallback" aria-hidden="true" />
      )}

      {/* Blur overlay */}
      <div className="mosaic-blur" aria-hidden="true" />

      {/* Hero content */}
      <div className="hero container text-center text-white">
        <h1 className="display-5 fw-bold">Find your person</h1>
        <p className="lead mb-4">
          Real people. Real connections. Join and start matching today.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <Link to="/signup" className="btn btn-primary btn-lg">
            Get started
          </Link>
          <Link to="/login" className="btn btn-outline-light btn-lg">
            Sign in
          </Link>
        </div>
        {currentUser && loading && (
          <div className="small mt-3 opacity-75">Loading photos…</div>
        )}
      </div>
    </div>
  );
}
