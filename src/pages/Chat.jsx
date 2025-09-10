// src/pages/Chat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { ensureThread, listenMessages, sendMessage, markThreadRead } from "../services/chat";

function bubbleSide(me, msg) {
  return msg.from === me ? "end" : "start";
}

export default function Chat() {
  const { matchId, otherUid } = useParams();
  const auth = useAuth() || {};
  const me = auth.currentUser || auth.user || null;
  const myUid = me?.uid || null;

  const [peerUid, setPeerUid] = useState(otherUid || null);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  // Resolve peer from match doc if needed
  useEffect(() => {
    let alive = true;
    (async () => {
      if (peerUid || !matchId || !myUid) return;
      try {
        const mRef = doc(db, "matches", matchId);
        const mSnap = await getDoc(mRef);
        if (mSnap.exists()) {
          const data = mSnap.data() || {};
          const other =
            (Array.isArray(data.users) && data.users.find((u) => u !== myUid)) ||
            (data.u1 && data.u2 && (data.u1 === myUid ? data.u2 : data.u1)) ||
            null;
          if (alive) setPeerUid(other);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { alive = false; };
  }, [matchId, myUid, peerUid]);

  // Ensure thread & listen to messages
  useEffect(() => {
    if (!myUid || !peerUid) return;
    let unsub = null;
    (async () => {
      const tid = await ensureThread(myUid, peerUid);
      setThreadId(tid);
      unsub = listenMessages(tid, setMessages);
    })();
    return () => { if (unsub) unsub(); };
  }, [myUid, peerUid]);

  // Autoscroll + mark last incoming as read
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!threadId || !myUid || !messages.length) return;
    const last = messages[messages.length - 1];
    if (last.from !== myUid) {
      markThreadRead(threadId, myUid).catch(() => {});
    }
  }, [messages, myUid, threadId]);

  const emptyState = useMemo(() => !peerUid, [peerUid]);

  async function onSend(e) {
    e.preventDefault();
    if (!threadId || !myUid || !peerUid || !text.trim()) return;
    try {
      setBusy(true);
      await sendMessage(threadId, { from: myUid, to: peerUid, text });
      setText("");
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to send.");
    } finally {
      setBusy(false);
    }
  }

  if (emptyState) {
    return (
      <div className="container" style={{ padding: 16 }}>
        <h3 className="text-white fw-bold mb-2">Chat</h3>
        <div className="text-white-50">Pick someone from Matches or Browse to start a chat.</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: 16, maxWidth: 820 }}>
      <h3 className="text-white fw-bold mb-2">Chat</h3>

      <div
        className="card"
        style={{
          borderRadius: 16,
          background: "rgba(0,0,0,.25)",
          border: "1px solid rgba(255,255,255,.2)",
          minHeight: 380,
          display: "flex",
        }}
      >
        {/* messages */}
        <div className="p-3" style={{ flex: 1, overflowY: "auto" }}>
          {messages.map((m) => (
            <div key={m.id} className={`d-flex justify-content-${bubbleSide(myUid, m)} mb-2`}>
              <div
                className={`px-3 py-2 rounded-3 ${
                  m.from === myUid ? "bg-warning text-dark" : "bg-light text-dark"
                }`}
                style={{ maxWidth: "80%", fontWeight: 700 }}
                title={
                  m.createdAt?.seconds
                    ? new Date(m.createdAt.seconds * 1000).toLocaleString()
                    : ""
                }
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* composer */}
        <form onSubmit={onSend} className="border-top p-2 d-flex" style={{ gap: 8 }}>
          <input
            className="form-control"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn btn-primary fw-bold" disabled={busy || !text.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
