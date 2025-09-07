// src/pages/Chat.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, limit,
} from "firebase/firestore";
import { db } from "../firebase";
import ZoomableAvatar from "../components/ZoomableAvatar";

function stableMatchId(a, b) {
  a = String(a || "");
  b = String(b || "");
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export default function Chat() {
  const { matchId: matchIdParam, otherUid: otherUidParam } = useParams();
  const auth = getAuth();
  const me = auth.currentUser;

  const [matchId, setMatchId] = useState("");
  const [otherUid, setOtherUid] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (!me) return;
    if (matchIdParam) {
      const [a, b] = String(matchIdParam).split("_");
      const guessOther = a === me.uid ? b : b === me.uid ? a : "";
      setMatchId(matchIdParam);
      setOtherUid(guessOther);
    } else if (otherUidParam) {
      const mid = stableMatchId(me.uid, otherUidParam);
      setMatchId(mid);
      setOtherUid(otherUidParam);
    } else {
      setMatchId("");
      setOtherUid("");
    }
  }, [me, matchIdParam, otherUidParam]);

  useEffect(() => {
    if (!otherUid) {
      setOtherUser(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", otherUid));
        if (!cancelled) setOtherUser(snap.exists() ? { id: otherUid, ...snap.data() } : null);
      } catch (e) {
        console.error("Load other user:", e);
        if (!cancelled) setOtherUser(null);
      }
    })();
    return () => { cancelled = true; };
  }, [otherUid]);

  useEffect(() => {
    if (!matchId) return;
    const q = query(
      collection(db, "chats", matchId, "messages"),
      orderBy("createdAt", "asc"),
      limit(500)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setMessages(list);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    });
    return () => unsub();
  }, [matchId]);

  async function sendMessage(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !me || !matchId) return;
    try {
      await addDoc(collection(db, "chats", matchId, "messages"), {
        text: trimmed,
        senderUid: me.uid,
        fromUid: me.uid,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (e) {
      console.error("sendMessage:", e);
    }
  }

  const headerName = useMemo(() => {
    return otherUser?.displayName || otherUser?.name || "Conversation";
  }, [otherUser]);

  if (!me) {
    return (
      <div className="container py-5 text-center">
        <h4>Please sign in</h4>
        <Link className="btn btn-primary mt-2" to="/login">Go to login</Link>
      </div>
    );
  }

  if (!matchId) {
    return (
      <div className="container py-5 text-center text-white">
  <h4>Messages</h4>
  <p>Select someone from Matches, or start a chat from Browse.</p>
</div>

    );
  }

  const photo =
    otherUser?.photoURL ||
    (otherUser?.photos && Array.isArray(otherUser.photos) && otherUser.photos[0]) ||
    "https://via.placeholder.com/200x200?text=Photo";
  const isCollegeVerified = !!otherUser?.verification?.college;

  return (
    <div className="container py-3" style={{ maxWidth: 800 }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <ZoomableAvatar
          src={photo}
          alt={headerName}
          size={56}
          rounded={999}
          badgeSize={18}
          badgePosition="br"
          verified={isCollegeVerified}
        />
        <div className="me-auto">
          <div style={{ fontWeight: 700, fontSize: 18 }}>{headerName}</div>
          {isCollegeVerified && (
            <div className="text-muted" style={{ fontSize: 12 }}>College verified</div>
          )}
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/matches">Back to Matches</Link>
      </div>

      {/* Messages */}
      <div className="border rounded p-3 mb-3" style={{ height: 420, overflowY: "auto", background: "#fff" }}>
        {messages.length === 0 && (
          <div className="text-muted text-center">No messages yet — say hi 👋</div>
        )}
        {messages.map((m) => {
          const mine = m.senderUid === me.uid || m.fromUid === me.uid;
          return (
            <div key={m.id} className={`d-flex ${mine ? "justify-content-end" : "justify-content-start"} mb-2`}>
              <div className={`px-3 py-2 rounded-3 ${mine ? "bg-warning" : "bg-light"}`} style={{ maxWidth: "70%" }}>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form onSubmit={sendMessage} className="d-flex gap-2">
        <input
          className="form-control"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary" disabled={!text.trim()}>Send</button>
      </form>
    </div>
  );
}
