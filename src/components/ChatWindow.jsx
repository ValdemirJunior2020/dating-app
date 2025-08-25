// src/components/ChatWindow.jsx
import React, { useEffect, useRef, useState } from "react";
import { sendMessage, subscribeMessages } from "../services/chat";
import { useAuth } from "../context/AuthContext";
import { getUserProfile } from "../services/users";
import { suggestOpener } from "../services/gemini";

export default function ChatWindow({ matchId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [other, setOther] = useState(null);
  const [loadingOpener, setLoadingOpener] = useState(false);
  const endRef = useRef(null);

  // Derive other uid from matchId: it's "uidA_uidB" sorted
  useEffect(() => {
    let alive = true;
    async function loadOther() {
      if (!matchId || !user?.uid) return;
      const [a, b] = matchId.split("_");
      const themUid = a === user.uid ? b : a;
      const p = await getUserProfile(themUid);
      if (alive) setOther(p);
    }
    loadOther();
    return () => { alive = false; };
  }, [matchId, user]);

  useEffect(() => {
    if (!matchId) return;
    const unsub = subscribeMessages(matchId, (rows) => setMessages(rows));
    return () => unsub();
  }, [matchId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    try {
      await sendMessage(matchId, user.uid, t);
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleOpener() {
    try {
      setLoadingOpener(true);
      const last = messages.length ? messages[messages.length - 1]?.text : "";
      const mine = { uid: user.uid, name: user.displayName, city: user.city, interests: "" };
      const opener = await suggestOpener({ me: mine, them: other, lastMessage: last });
      setText(opener);
    } finally {
      setLoadingOpener(false);
    }
  }

  const otherName = other?.name || other?.displayName || other?.uid || "New match";
  const otherInitial = String(otherName).slice(0, 1).toUpperCase();

  return (
    <div className="card card-soft" style={{ height: "75vh" }}>
      {/* Header */}
      <div className="card-header bg-white border-0">
        <div className="d-flex align-items-center gap-2">
          {other?.photoURL ? (
            <img src={other.photoURL} alt="" className="avatar avatar-lg" />
          ) : (
            <div className="initials bg-primary text-white avatar-lg">{otherInitial}</div>
          )}
          <div>
            <div className="fw-semibold">{otherName}</div>
            {other?.city && <div className="small text-muted">{other.city}</div>}
          </div>
          <div className="ms-auto">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleOpener}
              disabled={loadingOpener}
              title="Suggest opener"
            >
              {loadingOpener ? "…" : "✨ Suggest opener"}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="card-body d-flex flex-column pt-2">
        <div className="flex-grow-1 overflow-auto pe-1">
          {messages.map((m) => {
            const mine = m.fromUid === user.uid;
            return (
              <div key={m.id} className={`d-flex ${mine ? "justify-content-end" : "justify-content-start"} mb-2`}>
                <div
                  className={`p-2 rounded-3 ${mine ? "bg-primary text-white" : "bg-light"}`}
                  style={{ maxWidth: "80%" }}
                >
                  <div className="small mb-1">{mine ? "You" : otherName}</div>
                  <div>{m.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <form className="mt-2 d-flex gap-2" onSubmit={handleSend}>
          <input
            className="form-control form-control-lg"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn btn-primary btn-lg" type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
