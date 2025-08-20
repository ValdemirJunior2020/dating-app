// src/pages/Matches.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { getUserProfile } from "../services/users";
import { subscribeLastMessage } from "../services/chat";

export default function Matches() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [profiles, setProfiles] = useState({}); // uid -> profile
  const [previews, setPreviews] = useState({}); // matchId -> {text, fromUid}

  // Subscribe to my matches
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "matches"), where("users", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push(d.data()));
      setRows(list);
    });
    return () => unsub();
  }, [user]);

  // Fetch other profiles + subscribe to last message
  useEffect(() => {
    const unsubscribers = [];
    rows.forEach((m) => {
      const otherUid = m.users.find((u) => u !== user?.uid);
      // Profile cache fill
      if (otherUid && !profiles[otherUid]) {
        getUserProfile(otherUid).then((p) => {
          if (p?.uid) setProfiles((prev) => ({ ...prev, [p.uid]: p }));
        });
      }
      // Last message preview
      unsubscribers.push(
        subscribeLastMessage(m.id, (msg) => {
          setPreviews((prev) => ({ ...prev, [m.id]: msg || null }));
        })
      );
    });
    return () => unsubscribers.forEach((u) => u && u());
  }, [rows, user, profiles]);

  return (
    <div className="container py-4">
      <h2 className="mb-3">Matches</h2>
      {rows.length === 0 ? (
        <div className="alert alert-light">No matches yet. Start liking!</div>
      ) : (
        <div className="list-group">
          {rows.map((m) => {
            const otherUid = m.users.find((u) => u !== user.uid);
            const p = profiles[otherUid] || {};
            const name = p.name || otherUid;
            const city = p.city ? ` · ${p.city}` : "";
            const last = previews[m.id];
            const previewText = last?.text ? (last.text.length > 60 ? last.text.slice(0, 60) + "…" : last.text) : "Say hi 👋";

            return (
              <Link
                key={m.id}
                className="list-group-item list-group-item-action d-flex align-items-center"
                to={`/chat/${m.id}`}
              >
                {p.photoURL ? (
                  <img src={p.photoURL} alt="" className="avatar me-3" />
                ) : (
                  <div className="initials bg-primary text-white me-3">{String(name).slice(0,1).toUpperCase()}</div>
                )}
                <div className="flex-grow-1">
                  <div className="fw-semibold">{name}<span className="text-muted">{city}</span></div>
                  <div className="small text-muted">{previewText}</div>
                </div>
                <span className="badge text-bg-primary ms-2">Chat</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
