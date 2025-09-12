// src/pages/Chat.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { ensureThread, listenMessages, sendMessage } from "../services/chat";

function bubbleSide(meUid, msg) {
  return msg.from === meUid ? "end" : "start";
}

export default function Chat() {
  const params = useParams();
  const { user: me } = useAuth() || {};
  const myUid = me?.uid || null;

  // Be liberal about route param name
  const peerUid =
    params.otherUid || params.uid || params.userId || params.id || null;

  const [peerDoc, setPeerDoc] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  // Load peer user doc
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!peerUid) {
        setPeerDoc(null);
        return;
      }
      const s = await getDoc(doc(db, "users", peerUid));
      if (!alive) return;
      setPeerDoc(s.exists() ? { id: peerUid, ...s.data() } : null);
    })();
    return () => {
      alive = false;
    };
  }, [peerUid]);

  // Ensure thread (if possible) & subscribe to messages
  useEffect(() => {
    let unsub = null;
    let alive = true;

    (async () => {
      if (!myUid || !peerUid) return;

      const tid = await ensureThread(peerUid); // may return null if not ready/self
      if (!alive || !tid) return;

      setThreadId(tid);
      unsub = listenMessages(tid, (msgs) => {
        setMessages(msgs);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
      });
    })();

    return () => {
      alive = false;
      if (unsub) unsub();
    };
  }, [myUid, peerUid]);

  async function onSend(e) {
    e.preventDefault();
    const clean = String(text || "").trim();
    if (!clean || busy) return;

    try {
      setBusy(true);

      // If thread not created yet (e.g., first keystrokes before effect finishes),
      // create it now so the input never has to be disabled.
      let tid = threadId;
      if (!tid && peerUid) {
        tid = await ensureThread(peerUid);
        if (tid) setThreadId(tid);
      }
      if (!tid) return;

      await sendMessage(tid, clean);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  const title = peerDoc?.displayName || peerDoc?.name || "Chat";

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Link to="/messages" className="btn btn-sm btn-outline-secondary">
            ← Back
          </Link>
          <h5 className="m-0">{title}</h5>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body" style={{ minHeight: 360 }}>
          {messages.length === 0 && <div className="text-muted">Say hi 👋</div>}

          {messages.map((m) => (
            <div key={m.id} className={"d-flex justify-content-" + bubbleSide(myUid, m)}>
              <div
                className={
                  "badge bg-" + (bubbleSide(myUid, m) === "end" ? "primary" : "secondary")
                }
                style={{ whiteSpace: "pre-wrap" }}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form onSubmit={onSend} className="card-footer d-flex gap-2">
          <input
            className="form-control"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            // allow typing even if threadId isn't ready yet
            disabled={busy}
          />
          <button className="btn btn-primary fw-bold" disabled={busy || !text.trim()}>
            {busy ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
