// src/pages/Likes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { listenIncomingLikes, sendLike } from "../services/likes";

export default function Likes() {
  const { user: me } = useAuth() || {};
  const myUid = me?.uid || null;

  const [incoming, setIncoming] = useState([]);
  const [people, setPeople] = useState({}); // uid -> user doc
  const [busy, setBusy] = useState({}); // uid -> boolean

  // Subscribe to likes where to == me
  useEffect(() => {
    if (!myUid) return;
    const unsub = listenIncomingLikes(myUid, setIncoming);
    return unsub;
  }, [myUid]);

  // Fetch user docs for senders
  useEffect(() => {
    (async () => {
      const missing = [];
      for (const lk of incoming) {
        const uid = lk.from;
        if (uid && !people[uid]) missing.push(uid);
      }
      if (!missing.length) return;
      const updates = {};
      for (const uid of missing) {
        const s = await getDoc(doc(db, "users", uid));
        if (s.exists()) updates[uid] = { id: uid, ...s.data() };
      }
      if (Object.keys(updates).length) setPeople((p) => ({ ...p, ...updates }));
    })();
  }, [incoming]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => {
    const ts = (lk) => lk.createdAt?.toMillis?.() ?? 0;
    return [...incoming].sort((a, b) => ts(b) - ts(a));
  }, [incoming]);

  async function likeBack(uid) {
    if (!uid || busy[uid]) return;
    setBusy((b) => ({ ...b, [uid]: true }));
    try {
      await sendLike(uid);
    } finally {
      setBusy((b) => ({ ...b, [uid]: false }));
    }
  }

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="m-0">Who liked you</h5>
        <div className="d-flex gap-2">
          <Link to="/browse" className="btn btn-outline-secondary btn-sm">
            Browse
          </Link>
          <Link to="/messages" className="btn btn-outline-secondary btn-sm">
            Messages
          </Link>
        </div>
      </div>

      <div className="row g-3">
        {list.map((lk) => {
          const u = people[lk.from] || {};
          return (
            <div className="col-12 col-sm-6 col-lg-4" key={lk.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <img
                      src={u.photoURL || "/avatar.png"}
                      alt={u.displayName || "User"}
                      width={48}
                      height={48}
                      style={{ borderRadius: 999, objectFit: "cover" }}
                    />
                    <div>
                      <div className="fw-semibold">{u.displayName || "User"}</div>
                      <div className="text-muted small">{u.school || "—"}</div>
                    </div>
                  </div>

                  <div className="text-muted small mb-3">
                    Liked you{" "}
                    {lk.createdAt?.toDate
                      ? lk.createdAt.toDate().toLocaleString()
                      : "recently"}
                  </div>

                  <div className="mt-auto d-flex gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => likeBack(u.id)}
                      disabled={!u.id || busy[u.id]}
                    >
                      {busy[u.id] ? "Liking…" : "Like back"}
                    </button>
                    <Link to={`/chat/${u.id}`} className="btn btn-outline-secondary btn-sm">
                      Chat
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {list.length === 0 && (
          <div className="col-12">
            <div className="alert alert-light border">
              No likes yet. Try boosting your profile to get seen more.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
