// src/pages/Chat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  ensureThread,
  listenMessages,
  listenThreadMeta,
  sendMessage,
  markThreadRead,
} from "../services/chat";

function bubbleSide(meUid, msg) {
  return msg.from === meUid ? "end" : "start";
}

export default function Chat() {
  const params = useParams();
  const { user: me } = useAuth() || {};
  const myUid = me?.uid || null;

  // Accept multiple param names for safety
  const peerUid =
    params.otherUid || params.uid || params.userId || params.id || params.matchId || null;

  const [peerDoc, setPeerDoc] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [threadMeta, setThreadMeta] = useState(null);
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

  // Ensure thread & subscribe to messages/meta
  useEffect(() => {
    let unsubMsgs = null;
    let unsubMeta = null;
    let alive = true;

    (async () => {
      if (!myUid || !peerUid) return;

      const tid = await ensureThread(peerUid);
      if (!alive || !tid) return;

      setThreadId(tid);

      unsubMsgs = listenMessages(tid, (msgs) => {
        setMessages(msgs);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
      });

      unsubMeta = listenThreadMeta(tid, (meta) => setThreadMeta(meta));
    })();

    return () => {
      alive = false;
      if (unsubMsgs) unsubMsgs();
      if (unsubMeta) unsubMeta();
    };
  }, [myUid, peerUid]);

  // Mark as read when viewing if the last message is from the peer
  useEffect(() => {
    if (!threadId || !threadMeta || !myUid) return;
    const last = threadMeta.last || {};
    if (last.from && last.from !== myUid) {
      const already = last.readBy && last.readBy[myUid];
      if (!already) {
        markThreadRead(threadId, myUid);
      }
    }
  }, [threadId, threadMeta, myUid]);

  async function onSend(e) {
    e.preventDefault();
    const clean = String(text || "").trim();
    if (!clean || busy) return;

    try {
      setBusy(true);

      // create thread on demand if effect hasn't finished yet
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

  // Read receipt for last outgoing message
  const readReceipt = useMemo(() => {
    if (!threadMeta || !myUid) return null;
    const last = threadMeta.last || {};
    if (last.from !== myUid) return null; // only show for my last message
    const peerRead = last.readBy && peerUid && last.readBy[peerUid];
    return peerRead ? "Read" : "Sent";
  }, [threadMeta, myUid, peerUid]);

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
          {messages.length === 0 && <div className="text-muted mb-2">Say hi 👋</div>}

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

          {/* Read receipt (last outgoing) */}
          {readReceipt && (
            <div className="text-muted small mt-2 d-flex justify-content-end">
              {readReceipt}
            </div>
          )}

          <div ref={endRef} />
        </div>

        <form onSubmit={onSend} className="card-footer d-flex gap-2">
          <input
            className="form-control"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
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
