// src/pages/Matches.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { getUserProfile } from "../services/users";
import { useAuth } from "../context/AuthContext";

const PLACEHOLDER = "/logo.png";

/** get the first usable photo */
function primaryPhoto(user) {
  const photos = Array.isArray(user?.photos) ? user.photos : [];
  const first = photos.find((u) => typeof u === "string" && u.length > 6);
  return first || (typeof user?.photoURL === "string" ? user.photoURL : null);
}

/** tolerate array | comma string | object map */
function tagsFrom(x) {
  if (Array.isArray(x)) return x.filter(Boolean);
  if (typeof x === "string") {
    return x.split(",").map((t) => t.trim()).filter(Boolean);
  }
  if (x && typeof x === "object") {
    return Object.keys(x).filter((k) => Boolean(x[k]));
  }
  return [];
}

/** resolve the "other" uid from either users[] or u1/u2 schema */
function otherUidFromMatch(m, myUid) {
  if (Array.isArray(m?.users) && m.users.length) {
    return m.users.find((x) => x !== myUid) || null;
  }
  if (m?.u1 && m?.u2) {
    return m.u1 === myUid ? m.u2 : m.u1;
  }
  return null;
}

function MatchCard({ other, createdAt }) {
  const url = primaryPhoto(other);
  const hasPhoto = !!url;
  const tags = tagsFrom(other?.interests).slice(0, 6);

  return (
    <div
      className="card h-100"
      style={{
        background: "rgba(0,0,0,.25)",
        border: "1px solid rgba(255,255,255,.3)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Circular avatar */}
      <div
        className="d-flex flex-column align-items-center"
        style={{ paddingTop: 18, paddingBottom: 8 }}
      >
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            overflow: "hidden",
            border: "4px solid rgba(255,255,255,.7)",
            boxShadow: "0 8px 24px rgba(0,0,0,.35)",
            background: "#1b1b1b",
          }}
        >
          <img
            src={hasPhoto ? url : PLACEHOLDER}
            alt={other.displayName || other.name || "match"}
            data-enlarge={hasPhoto ? url : undefined}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              cursor: hasPhoto ? "zoom-in" : "default",
              display: "block",
            }}
          />
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="d-flex align-items-center justify-content-between">
          <h6 className="m-0 text-white fw-bold">
            {other.displayName || other.name || "Someone"}
          </h6>
          {other.age ? (
            <span className="badge bg-light text-dark fw-bold">{other.age}</span>
          ) : null}
        </div>

        <div className="text-white-50 small mt-1">
          {createdAt
            ? `Matched ${new Date(
                (createdAt?.seconds ? createdAt.seconds * 1000 : createdAt) || Date.now()
              ).toLocaleDateString()}`
            : ""}
        </div>

        <div className="mt-2" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {tags.length ? (
            tags.map((tag) => (
              <span
                key={tag}
                className="badge rounded-pill"
                style={{ background: "#ffe98a", color: "#4b2a00", fontWeight: 800 }}
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
  );
}

export default function Matches() {
  // ✅ support both shapes from your AuthContext
  const auth = useAuth() || {};
  const uid = auth.currentUser?.uid || auth.user?.uid || null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    // If we somehow render without a uid (shouldn't happen under RequireAuth),
    // stop the spinner instead of "loading forever".
    if (!uid) {
      setLoading(false);
      setRows([]);
      return () => {};
    }

    (async () => {
      try {
        setLoading(true);

        // We avoid orderBy here so you don't need a composite index right now.
        // If you want it ordered by createdAt, create the index and add orderBy back.
        const q = query(
          collection(db, "matches"),
          where("users", "array-contains", uid)
        );

        const snap = await getDocs(q);
        const raw = [];
        snap.forEach((d) => raw.push({ id: d.id, ...d.data() }));

        // Also support legacy docs that used u1/u2 and may not match the query above
        // (OPTIONAL) If you still have old docs, you can additionally fetch them by u1/u2.

        // Fetch the "other" profile for each match
        const withProfiles = await Promise.all(
          raw.map(async (m) => {
            const otherUid = otherUidFromMatch(m, uid);
            const other = otherUid ? await getUserProfile(otherUid) : null;
            return { ...m, other };
          })
        );

        if (alive) setRows(withProfiles.filter((r) => r.other));
      } catch (e) {
        console.error(e);
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [uid]);

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows]);

  return (
    <div className="container" style={{ padding: 16 }}>
      <h3 className="text-white fw-bold mb-3">Matches</h3>

      {loading && <div className="text-white-50">Loading…</div>}
      {empty && <div className="text-white-50">No matches yet.</div>}

      <div className="row g-3">
        {rows.map((m) => (
          <div className="col-6 col-md-4 col-lg-3" key={m.id}>
            <MatchCard other={m.other} createdAt={m.createdAt} />
          </div>
        ))}
      </div>
    </div>
  );
}
