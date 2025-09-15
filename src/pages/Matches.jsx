// src/pages/Matches.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { listenThreadsForUser } from "../services/chat";

function lastPreview(t) {
  const txt = t?.last?.text || "";
  return txt.length > 80 ? txt.slice(0, 80) + "…" : txt;
}

function isUnreadForMe(t, myUid) {
  const last = t?.last;
  if (!last) return false;
  if (last.from === myUid) return false;
  const rb = last.readBy || {};
  return !rb[myUid];
}

export default function Matches() {
  const { user } = useAuth() || {};
  const myUid = user?.uid || null;
  const nav = useNavigate();

  const [threads, setThreads] = useState([]);
  const [peers, setPeers] = useState({}); // uid -> {id, ...user}
  const [loading, setLoading] = useState(true);

  // Subscribe to my threads inbox (ordered by updatedAt desc)
  useEffect(() => {
    if (!myUid) return;
    setLoading(true);
    const unsub = listenThreadsForUser(myUid, (list) => {
      setThreads(list || []);
      setLoading(false);
    });
    return unsub;
  }, [myUid]);

  // Fetch missing peer profiles for visible threads (simple cache)
  useEffect(() => {
    if (!myUid || threads.length === 0) return;

    const missing = new Set();
    for (const t of threads) {
      const other = (t.users || []).find((u) => u !== myUid);
      if (other && !peers[other]) missing.add(other);
    }
    if (missing.size === 0) return;

    (async () => {
      const updates = {};
      await Promise.all(
        Array.from(missing).map(async (uid) => {
          try {
            const s = await getDoc(doc(db, "users", uid));
            if (s.exists()) updates[uid] = { id: s.id, ...s.data() };
          } catch {}
        })
      );
      if (Object.keys(updates).length) {
        setPeers((p) => ({ ...p, ...updates }));
      }
    })();
  }, [threads, myUid, peers]);

  const empty = useMemo(() => !loading && threads.length === 0, [loading, threads]);

  return (
    <div className="container py-3">
      <h4 className="fw-bold mb-3">Matches</h4>

      {loading && <div className="text-muted">Loading…</div>}
      {empty && <div className="text-muted">No matches yet. Start liking people in Browse!</div>}

      <div className="list-group">
        {threads.map((t) => {
          const peerUid = (t.users || []).find((u) => u !== myUid);
          const peer = peerUid ? peers[peerUid] : null;
          const avatar = peer?.photoURL || "/logo.png";
          const name = peer?.displayName || peer?.name || (peerUid ? "Someone" : "Unknown");
          const unread = isUnreadForMe(t, myUid);

          return (
            <button
              key={t.id}
              type="button"
              className="list-group-item list-group-item-action d-flex gap-3 align-items-center"
              onClick={() => peerUid && nav(`/chat/with/${peerUid}`)}
              disabled={!peerUid}
            >
              <img
                src={avatar}
                alt={name}
                width={48}
                height={48}
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(0,0,0,.1)",
                }}
              />
              <div className="flex-grow-1 text-start">
                <div className="d-flex align-items-center gap-2">
                  <div className="fw-semibold">{name}</div>
                  {unread && <span className="badge bg-primary">Unread</span>}
                </div>
                <div className="text-muted small">{lastPreview(t) || "Say hi 👋"}</div>
              </div>
              <div className="text-muted small">
                {/* Optional: show relative time if you have a util */}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
