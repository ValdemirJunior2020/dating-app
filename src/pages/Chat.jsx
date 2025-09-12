// src/pages/Chat.jsx
<<<<<<< HEAD
import React, { useEffect, useRef, useState } from "react";
=======
import React, { useEffect, useMemo, useRef, useState } from "react";
>>>>>>> 3892ccaa8de9972aa8cad4107a35c273bd5e3ece
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { ensureThread, listenMessages, sendMessage } from "../services/chat";
<<<<<<< HEAD
=======
import { isCollegeVerified } from "../services/eligibility";
>>>>>>> 3892ccaa8de9972aa8cad4107a35c273bd5e3ece

function bubbleSide(meUid, msg) {
  return msg.from === meUid ? "end" : "start";
}

export default function Chat() {
  const { otherUid } = useParams();
  const { user: me } = useAuth() || {};
  const myUid = me?.uid || null;

<<<<<<< HEAD
  const peerUid = otherUid || null;

  const [peerDoc, setPeerDoc] = useState(null);
=======
  const [meDoc, setMeDoc] = useState(null);
  const [peerDoc, setPeerDoc] = useState(null);
  const [peerUid, setPeerUid] = useState(otherUid || null);
>>>>>>> 3892ccaa8de9972aa8cad4107a35c273bd5e3ece
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const endRef = useRef(null);

<<<<<<< HEAD
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!peerUid) {
        setPeerDoc(null);
        return;
=======
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
>>>>>>> 3892ccaa8de9972aa8cad4107a35c273bd5e3ece
      }
      const s = await getDoc(doc(db, "users", peerUid));
      if (!alive) return;
      setPeerDoc(s.exists() ? { id: peerUid, ...s.data() } : null);
    })();
<<<<<<< HEAD
    return () => {
      alive = false;
    };
  }, [peerUid]);

=======
    return () => { alive = false; };
  }, [matchId, myUid, otherUid]);

  // Ensure thread & listen
>>>>>>> 3892ccaa8de9972aa8cad4107a35c273bd5e3ece
  useEffect(() => {
    let unsub = null;
    let alive = true;

    (async () => {
      if (!myUid || !peerUid) return;

      const tid = await ensureThread(peerUid);
      if (!alive || !tid) return;

      setThreadId(tid);
      unsub = listenMessages(tid, (msgs) => {
        setMessages(msgs);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
      });
    })();
<<<<<<< HEAD

    return () => {
      alive = false;
      if (unsub) unsub();
    };
  }, [myUid, peerUid]);

  async function onSend(e) {
    e.preventDefault();
    if (!threadId || busy) return;
    const clean = String(text || "").trim();
    if (!clean) return;
=======
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
>>>>>>> 3892ccaa8de9972aa8cad4107a35c273bd5e3ece
    try {
      setBusy(true);
      await sendMessage(threadId, clean);
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

<<<<<<< HEAD
=======
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
>>>>>>> 3892ccaa8de9972aa8cad4107a35c273bd5e3ece
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
<<<<<<< HEAD
            disabled={busy || !threadId}
          />
          <button className="btn btn-primary fw-bold" disabled={busy || !threadId || !text.trim()}>
            {busy ? "Sending…" : "Send"}
=======
            disabled={!canChat}
          />
          <button className="btn btn-primary fw-bold" disabled={!canChat || busy || !text.trim()}>
            Send
>>>>>>> 3892ccaa8de9972aa8cad4107a35c273bd5e3ece
          </button>
        </form>
      </div>
    </div>
  );
}
