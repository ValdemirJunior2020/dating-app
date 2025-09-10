// src/pages/Matches.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import useUnreadByPeer from "../hooks/useUnreadByPeer";
import UnreadDot from "../components/UnreadDot";

const PLACEHOLDER = "/logo.png";

function firstPhotoFrom(user) {
  const arr = Array.isArray(user?.photos) ? user.photos : [];
  const first = arr.find((u) => typeof u === "string" && u.length > 6);
  return first || user?.photoURL || null;
}

export default function Matches() {
  const auth = useAuth() || {};
  const meUid = auth.currentUser?.uid || auth.user?.uid || null;
  const unreadByPeer = useUnreadByPeer(meUid);

  const [rows, setRows] = useState([]); // [{id, users:[a,b]}]
  const [profiles, setProfiles] = useState({}); // { uid: userDoc }
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  // subscribe to my matches
  useEffect(() => {
    if (!meUid) return;
    const qy = query(collection(db, "matches"), where("users", "array-contains", meUid));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const out = [];
        snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
        setRows(out);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [meUid]);

  // fetch peer profiles
  useEffect(() => {
    let alive = true;
    (async () => {
      const need = new Set();
      rows.forEach((m) => {
        const other = Array.isArray(m.users) ? m.users.find((u) => u !== meUid) : null;
        if (other) need.add(other);
      });
      const next = {};
      await Promise.all(
        [...need].map(async (uid) => {
          const uRef = doc(db, "users", uid);
          const s = await getDoc(uRef);
          if (s.exists()) next[uid] = { id: s.id, ...s.data() };
        })
      );
      if (alive) setProfiles(next);
    })();
    return () => {
      alive = false;
    };
  }, [rows, meUid]);

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows]);

  function openChat(match) {
    nav(`/chat/${match.id}`);
  }

  return (
    <div className="container" style={{ padding: 16 }}>
      <h3 className="text-white fw-bold mb-3">Matches</h3>

      {loading && <div className="text-white-50">Loading…</div>}
      {empty && <div className="text-white-50">No matches yet.</div>}

      <div className="row g-4">
        {rows.map((m) => {
          const other = Array.isArray(m.users) ? m.users.find((u) => u !== meUid) : null;
          const u = other ? profiles[other] : null;
          const photo = u ? firstPhotoFrom(u) : null;

          return (
            <div className="col-12 col-sm-6 col-lg-3" key={m.id}>
              <div
                className="card shadow-sm p-3"
                style={{
                  borderRadius: 18,
                  background: "rgba(0,0,0,.25)",
                  border: "1px solid rgba(255,255,255,.15)",
                  textAlign: "center",
                  color: "#fff",
                }}
              >
                <div
                  style={{
                    width: 170,
                    height: 170,
                    borderRadius: "50%",
                    overflow: "hidden",
                    margin: "0 auto 12px",
                    border: "4px solid rgba(255,255,255,.7)",
                    background: "#1b1b1b",
                    boxShadow: "0 10px 28px rgba(0,0,0,.35)",
                    position: "relative",
                    cursor: photo ? "zoom-in" : "default",
                  }}
                  onClick={() => {
                    if (!photo) return;
                    const img = document.createElement("img");
                    img.setAttribute("data-enlarge", photo);
                    document.body.appendChild(img);
                    img.click();
                    img.remove();
                  }}
                >
                  <img
                    src={photo || PLACEHOLDER}
                    alt={u?.displayName || "profile"}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    data-enlarge={photo || undefined}
                  />
                  <UnreadDot show={other ? unreadByPeer.has(other) : false} />
                </div>

                <div className="fw-bold mb-2" style={{ fontSize: 18 }}>
                  {u?.displayName || u?.name || "Someone"}
                </div>

                <div className="d-flex justify-content-center gap-2">
                  <button className="btn btn-sm btn-warning fw-bold" onClick={() => openChat(m)}>
                    Say hi
                  </button>
                  {other && (
                    <Link className="btn btn-sm btn-outline-light fw-bold" to={`/u/${other}`}>
                      View profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
