// src/pages/Chat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
import { listenPresence, setTypingIn } from "../services/presence";
import PaywallModal from "../components/PaywallModal";

function bubbleSide(meUid, msg) {
  return msg.from === meUid ? "end" : "start";
}
function isRecentlyOnline(p) {
  if (!p?.lastSeen?.toDate) return false;
  return Date.now() - p.lastSeen.toDate().getTime() < 2 * 60 * 1000;
}

export default function Chat() {
  const params = useParams();
  const nav = useNavigate();
  const { user: me } = useAuth() || {};
  const myUid = me?.uid || null;

  const peerUid =
    params.otherUid || params.uid || params.userId || params.id || params.matchId || null;

  const [peerDoc, setPeerDoc] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [threadMeta, setThreadMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [peerPresence, setPeerPresence] = useState(null);

  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallLimit, setPaywallLimit] = useState(3);

  const endRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(null);

  // Load peer user doc
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!peerUid) {
        if (!cancelled) setPeerDoc(null);
        return;
      }
      const s = await getDoc(doc(db, "users", peerUid));
      if (!cancelled) setPeerDoc(s.exists() ? { id: peerUid, ...s.data() } : null);
    })();
    return () => { cancelled = true; };
  }, [peerUid]);

  // Ensure thread & subscribe
  useEffect(() => {
    let unsubMsgs = null;
    let unsubMeta = null;
    let cancelled = false;

    (async () => {
      if (!myUid || !peerUid) return;

      try {
        const tid = await ensureThread(peerUid);
        if (cancelled || !tid) return;
        setThreadId(tid);

        unsubMsgs = listenMessages(tid, (msgs) => {
          setMessages(msgs);
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
        });

        unsubMeta = listenThreadMeta(tid, (meta) => setThreadMeta(meta));
      } catch (e) {
        if (e?.code === "PAYWALL_REQUIRED") {
          setPaywallLimit(e.limit || 3);
          setPaywallOpen(true);
        } else {
          console.error(e);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (unsubMsgs) unsubMsgs();
      if (unsubMeta) unsubMeta();
    };
  }, [myUid, peerUid]);

  // Presence subscribe
  useEffect(() => {
    if (!peerUid) return () => {};
    const unsub = listenPresence(peerUid, setPeerPresence);
    return unsub;
  }, [peerUid]);

  // Mark read
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

  // Typing indicator
  useEffect(() => {
    if (!threadId || !myUid) return;

    const now = Date.now();
    const isTyping = text.trim().length > 0;
    const canWrite = !lastTypingSent.current || now - lastTypingSent.current > 1000;

    if (isTyping && canWrite) {
      setTypingIn(threadId);
      lastTypingSent.current = now;
    }
    if (!isTyping && canWrite) {
      setTypingIn(null);
      lastTypingSent.current = now;
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTyping) {
      typingTimer.current = setTimeout(() => {
        setTypingIn(null);
        lastTypingSent.current = Date.now();
      }, 2000);
    }

    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [text, threadId, myUid]);

  async function onSend(e) {
    e.preventDefault();
    const clean = String(text || "").trim();
    if (!clean || busy) return;

    try {
      setBusy(true);
      if (!threadId) return; // paywall prevented thread creation
      await sendMessage(threadId, clean);
      setText("");
      setTypingIn(null);
      lastTypingSent.current = Date.now();
    } finally {
      setBusy(false);
    }
  }

  const title = peerDoc?.displayName || peerDoc?.name || "Chat";
  const peerTyping = peerPresence?.typingIn === threadId;
  const peerOnline = peerPresence?.online || isRecentlyOnline(peerPresence);

  const readReceipt = useMemo(() => {
    if (!threadMeta || !myUid) return null;
    const last = threadMeta.last || {};
    if (last.from !== myUid) return null;
    const peerRead = last.readBy && peerUid && last.readBy[peerUid];
    return peerRead ? "Read" : "Sent";
  }, [threadMeta, myUid, peerUid]);

  return (
    <>
      <div className="container py-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <Link to="/messages" className="btn btn-sm btn-outline-secondary">
              ← Back
            </Link>
            <h5 className="m-0">{title}</h5>
            {peerOnline && <span className="badge bg-success">Online</span>}
          </div>
          {peerTyping && <div className="text-muted small">typing…</div>}
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

            {readReceipt && (
              <div className="text-muted small mt-2 d-flex justify-content-end">{readReceipt}</div>
            )}

            <div ref={endRef} />
          </div>

          <form onSubmit={onSend} className="card-footer d-flex gap-2">
            <input
              className="form-control"
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={busy || !threadId}
            />
            <button className="btn btn-primary fw-bold" disabled={busy || !text.trim() || !threadId}>
              {busy ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </div>

      <PaywallModal
        open={paywallOpen}
        limit={paywallLimit}
        onClose={() => setPaywallOpen(false)}
        onUpgrade={() => nav("/premium")}
      />
    </>
  );
}
