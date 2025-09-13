// src/pages/Messages.jsx  (adds unread dot using thread.last.readBy)
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { listenThreadsForUser } from "../services/chat";

function peerFromUsers(users = [], me) {
  return Array.isArray(users) ? users.find((u) => u !== me) || null : null;
}

export default function Messages() {
  const { user: me } = useAuth() || {};
  const myUid = me?.uid || null;

  const [threads, setThreads] = useState([]);
  const [peers, setPeers] = useState({}); // { uid: userDoc }

  // Subscribe to my threads
  useEffect(() => {
    if (!myUid) return;
    const unsub = listenThreadsForUser(myUid, setThreads);
    return unsub;
  }, [myUid]);

  // Fetch peer docs for any threads we don't know yet
  useEffect(() => {
    (async () => {
      const missing = [];
      for (const t of threads) {
        const puid = peerFromUsers(t.users, myUid);
        if (puid && !peers[puid]) missing.push(puid);
      }
      if (missing.length === 0) return;
      const updates = {};
      for (const uid of missing) {
        const s = await getDoc(doc(db, "users", uid));
        if (s.exists()) updates[uid] = { id: uid, ...s.data() };
      }
      if (Object.keys(updates).length) {
        setPeers((prev) => ({ ...prev, ...updates }));
      }
    })();
  }, [threads, myUid]); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => {
    const ts = (t) =>
      (t.lastMessageAt?.toMillis?.() ?? 0) || (t.updatedAt?.toMillis?.() ?? 0) || 0;
    return [...threads].sort((a, b) => ts(b) - ts(a));
  }, [threads]);

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="m-0">Messages</h5>
        <Link to="/browse" className="btn btn-outline-secondary btn-sm">
          Browse
        </Link>
      </div>

      <div className="list-group">
        {sorted.map((t) => {
          const puid = peerFromUsers(t.users, myUid);
          const p = (puid && peers[puid]) || {};
          const last = t.last || {};
          const unread =
            last.from && last.from !== myUid && !(last.readBy && last.readBy[myUid]);

          return (
            <Link
              key={t.id}
              to={`/chat/${puid}`}
              className="list-group-item list-group-item-action d-flex align-items-center gap-3"
            >
              <img
                src={p.photoURL || "/avatar.png"}
                alt={p.displayName || "User"}
                width={40}
                height={40}
                style={{ borderRadius: 999, objectFit: "cover" }}
              />
              <div className="flex-fill">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="fw-semibold">{p.displayName || "User"}</div>
                  {unread && (
                    <span
                      className="badge rounded-pill bg-primary"
                      aria-label="Unread"
                      title="Unread"
                    >
                      ●
                    </span>
                  )}
                </div>
                <div className="text-muted small">
                  {last.text ? last.text : "No messages yet."}
                </div>
              </div>
            </Link>
          );
        })}

        {sorted.length === 0 && (
          <div className="list-group-item text-muted">No messages yet.</div>
        )}
      </div>
    </div>
  );
}
