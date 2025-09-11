// src/pages/Chat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { ensureThread, listenMessages, sendMessage } from "../services/chat";
import { isCollegeVerified } from "../services/eligibility";

function bubbleSide(me, msg) {
  return msg.from === me ? "end" : "start";
}

export default function Chat() {
  const { matchId, otherUid } = useParams();
  const auth = useAuth() || {};
  const me = auth.currentUser || auth.user || null;
  const myUid = me?.uid || null;

  const [meDoc, setMeDoc] = useState(null);
  const [peerDoc, setPeerDoc] = useState(null);
  const [peerUid, setPeerUid] = useState(otherUid || null);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  // Load my doc
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!myUid) { setMeDoc(null); return; }
      const s = await getDoc(doc(db, "users", myUid));
      if (alive) setMeDoc(s.exists() ? { id: s.id, ...s.data() } : null);
    })();
    return () => { alive = false; };
  }, [myUid]);

  // Resolve peer from match doc if needed; also load peer doc
  useEffect(() => {
    let alive = true;
    (async () => {
      let resolved = otherUid || null;
      if (!resolved && matchId && myUid) {
        try {
          const mRef = doc(db, "matches", matchId);
          const mSnap = await getDoc(mRef);
          if (mSnap.exists()) {
            const data = mSnap.data() || {};
            resolved =
              (Array.isArray(data.users) && data.users.find((u) => u !== myUid)) ||
              (data.u1 && data.u2 && (data.u1 === myUid ? data.u2 : data.u1)) ||
              null;
          }
        } catch (e) { console.error(e); }
      }
      if (alive) setPeerUid(resolved);

      if (resolved) {
        const s = await getDoc(doc(db, "users", resolved));
        if (alive) setPeerDoc(s.exists() ? { id: s.id, ...s.data() } : null);
      } else {
        if (alive) setPeerDoc(null);
      }
    })();
    return () => { alive = false; };
  }, [matchId, myUid, otherUid]);

  // Ensure thread & listen
  useEffect(() => {
    if (!myUid || !peerUid) return;
    let unsub = null;
    (async () => {
      const tid = await ensureThread(myUid, peerUid);
      setThreadId(tid);
      unsub = listenMessages(tid, setMessages);
    })();
    return () => { unsub && unsub(); };
  }, [myUid, peerUid]);

  // autoscroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const emptyState = useMemo(() => !peerUid, [peerUid]);

  const meVerified = isCollegeVerified(meDoc);
  const peerVerified = isCollegeVerified(peerDoc);
  const canChat = meVerified && peerVerified;

  async function onSend(e) {
    e.preventDefault();
    if (!canChat || !threadId || !myUid || !peerUid || !text.trim()) return;
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

      {!canChat && (
        <div className="alert alert-warning py-2">
          Only <strong>college-verified members</strong> can chat each other.{" "}
          {!meVerified && (
            <>
              <Link to="/edu-signup" className="alert-link">Verify your .edu</Link>{" "}
            </>
          )}
          {!peerVerified && "This person isn’t verified yet."}
        </div>
      )}

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
            disabled={!canChat}
          />
          <button className="btn btn-primary fw-bold" disabled={!canChat || busy || !text.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
