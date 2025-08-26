// src/components/ChatWindow.jsx
import React, { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { ensureChat, subscribeMessages, sendMessage } from "../services/chat";

export default function ChatWindow({ matchId }) {
  const me = auth.currentUser?.uid || null;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const endRef = useRef(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let unsub = null;
    setLoading(true);
    setErrMsg("");

    (async () => {
      try {
        // Ensure chat exists and membership is valid
        await ensureChat(matchId);
        unsub = subscribeMessages(
          matchId,
          (rows) => {
            setMessages(rows);
            setLoading(false);
            // Auto-scroll to bottom
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
          },
          (err) => {
            setErrMsg(err.message || "Failed to subscribe to messages.");
            setLoading(false);
          }
        );
      } catch (e) {
        setErrMsg(e.message || "You do not have access to this chat.");
        setLoading(false);
      }
    })();

    return () => unsub?.();
  }, [matchId]);

  async function handleSend(e) {
    e.preventDefault();
    if (sending || !text.trim()) return;
    setSending(true);
    setErrMsg("");
    try {
      await sendMessage(matchId, text);
      setText("");
    } catch (e) {
      console.error("send error:", e);
      setErrMsg(e.message || "Send failed: missing permission.");
    } finally {
      setSending(false);
    }
  }

  if (!matchId) {
    return <div className="text-light">No chat selected.</div>;
  }

  return (
    <div
      className="card shadow-sm"
      style={{ backgroundColor: "var(--brown-800)", border: "none" }}
    >
      <div className="card-body" style={{ minHeight: 360 }}>
        <h5 className="mb-3">Conversation</h5>

        {loading && <div className="text-light">Loading conversation…</div>}
        {!loading && errMsg && (
          <div className="alert alert-warning">{errMsg}</div>
        )}

        {!loading && !errMsg && (
          <div
            style={{
              maxHeight: 380,
              overflowY: "auto",
              paddingRight: 6,
              paddingLeft: 6,
            }}
          >
            {messages.length === 0 && (
              <p className="text-light">Say hello 👋</p>
            )}

            {messages.map((m) => {
              const mine = m.senderUid === me;
              return (
                <div
                  key={m.id}
                  className={`d-flex mb-2 ${mine ? "justify-content-end" : "justify-content-start"}`}
                >
                  <div
                    className="p-2"
                    style={{
                      maxWidth: "75%",
                      borderRadius: 12,
                      background: mine ? "var(--amber)" : "var(--brown-900)",
                      color: mine ? "var(--brown-900)" : "var(--text-light)",
                      boxShadow: "0 2px 6px rgba(0,0,0,.35)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="card-footer bg-transparent">
        <form className="d-flex gap-2" onSubmit={handleSend}>
          <input
            className="form-control"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!!errMsg || sending}
          />
          <button className="btn btn-primary" disabled={!!errMsg || sending || !text.trim()}>
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
