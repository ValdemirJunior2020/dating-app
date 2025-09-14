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

/* ---------- Small helpers ---------- */
function bubbleSide(meUid, msg) {
  return msg.from === meUid ? "end" : "start";
}
function isRecentlyOnline(p) {
  if (!p?.lastSeen?.toDate) return false;
  return Date.now() - p.lastSeen.toDate().getTime() < 2 * 60 * 1000; // 2 min
}
function photoCountFromDoc(userDoc) {
  if (!userDoc) return 0;
  if (Array.isArray(userDoc.photos)) return userDoc.photos.filter(Boolean).length;
  return userDoc.photoURL ? 1 : 0;
}

/* ---------- Inline Profile Nudge (no new files) ---------- */
function ProfileNudge({ meDoc }) {
  const nav = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const bioLen = (meDoc?.bio || "").trim().length;
  const pCount = photoCountFromDoc(meDoc);

  const needsBio = bioLen < 20; // encourage at least ~1–2 sentences
  const needsPhotos = pCount < 2; // encourage at least 2 photos

  if (dismissed || (!needsBio && !needsPhotos)) return null;

  const items = [];
  if (needsPhotos) items.push("add 2+ photos");
  if (needsBio) items.push("write a short bio");

  return (
    <div className="alert alert-info d-flex align-items-center justify-content-between">
      <div>
        <strong>Boost your matches:</strong> {items.join(" and ")} to stand out.
      </div>
      <div className="d-flex gap-2">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          Later
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => nav("/settings")}
          aria-label="Improve profile"
        >
          Improve profile
        </button>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Chat() {
  const params = useParams();
  const nav = useNavigate();
  const { user: me } = useAuth() || {};
  const myUid = me?.uid || null;

  // Accept multiple param names
  const peerUid =
    params.otherUid || params.uid || params.userId || params.id || params.matchId || null;

  const [myDoc, setMyDoc] = useState(null);
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

  /* Load my profile (for nudge) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!myUid) {
        if (!cancelled) setMyDoc(null);
        return;
      }
      try {
        const s = await getDoc(doc(db, "users", myUid));
        if (!cancelled) setMyDoc(s.exists() ? { id: myUid, ...s.data() } : null);
      } catch {
        if (!cancelled) setMyDoc(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [myUid]);

  /* Load peer user doc */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!peerUid) {
        if (!cancelled) setPeerDoc(null);
        return;
      }
      try {
        const s = await getDoc(doc(db, "users", peerUid));
        if (!cancelled) setPeerDoc(s.exists() ? { id: peerUid, ...s.data() } : null);
      } catch {
        if (!cancelled) setPeerDoc(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [peerUid]);

  /* Ensure thread & subscribe */
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

  /* Presence subscribe (peer) */
  useEffect(() => {
    if (!peerUid) return () => {};
    const unsub = listenPresence(peerUid, setPeerPresence);
    return unsub;
  }, [peerUid]);

  /* Mark last incoming as read */
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

  /* Typing indicator */
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
      if (!threadId) return; // blocked by paywall
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
    if (last.from !== myUid) return null; // only for my last message
    const peerRead = last.readBy && peerUid && last.readBy[peerUid];
    return peerRead ? "Read" : "Sent";
  }, [threadMeta, myUid, peerUid]);

  return (
    <>
      <div className="container py-3">
        {/* Inline profile nudge (shows if user needs bio/photos) */}
        <ProfileNudge meDoc={myDoc} />

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
              disabled={busy || !threadId} // disabled if paywall blocked thread creation
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
