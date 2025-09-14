// src/services/chat.js
// Threads + messages with daily free-new-chat gating and inbox listeners.

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  limit as qlimit,
  increment,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { isPremium, getFreeNewChatsPerDay, ymd } from "./limits";

function uid() {
  return auth?.currentUser?.uid || null;
}
function sortPair(a, b) {
  return [a, b].sort();
}
function tidFor(a, b) {
  const [x, y] = sortPair(a, b);
  return `${x}_${y}`;
}

/** Find existing thread id for pair or null */
async function findExistingThread(a, b) {
  const [x, y] = sortPair(a, b);
  const tid = tidFor(x, y);
  const s = await getDoc(doc(db, "threads", tid));
  return s.exists() ? tid : null;
}

/**
 * Ensure a thread with peerUid.
 * - If exists → returns tid
 * - If not, enforces daily free-new-chat limit (unless premium), creates thread, increments meter
 * Throws { code: "PAYWALL_REQUIRED", limit } if over the free limit.
 */
export async function ensureThread(peerUid) {
  const me = uid();
  if (!me || !peerUid || me === peerUid) throw new Error("Invalid users");

  // Fast path: if already exists, return it (no meter impact)
  const pre = await findExistingThread(me, peerUid);
  if (pre) return pre;

  // Premium users bypass the free limit (still create the thread safely)
  const premium = await isPremium(me);
  if (premium) {
    const tid = tidFor(me, peerUid);
    await runTransaction(db, async (tx) => {
      const tRef = doc(db, "threads", tid);
      const tSnap = await tx.get(tRef);
      if (tSnap.exists()) return;
      tx.set(tRef, {
        users: sortPair(me, peerUid),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: null,
        last: null,
      });
    });
    return tid;
  }

  // Non-premium: atomically check today's meter + create the thread + increment meter
  const tid = tidFor(me, peerUid);
  const res = await runTransaction(db, async (tx) => {
    const tRef = doc(db, "threads", tid);
    const meterRef = doc(db, "meters", me, "daily", ymd());
    const cfgRef = doc(db, "config", "app");

    const [tSnap, mSnap, cSnap] = await Promise.all([
      tx.get(tRef),
      tx.get(meterRef),
      tx.get(cfgRef),
    ]);

    if (tSnap.exists()) return { ok: true };

    const limit = Number(
      cSnap.exists() ? cSnap.data()?.freeNewChatsPerDay ?? 3 : 3
    );
    const count = mSnap.exists() ? Number(mSnap.data()?.count || 0) : 0;

    if (count >= limit) return { ok: false, limit };

    // Create thread
    tx.set(tRef, {
      users: sortPair(me, peerUid),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageAt: null,
      last: null,
    });

    // Upsert today's meter
    if (!mSnap.exists()) {
      tx.set(meterRef, {
        count: 1,
        date: ymd(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.update(meterRef, {
        count: increment(1),
        date: ymd(),
        updatedAt: serverTimestamp(),
      });
    }

    return { ok: true };
  });

  if (!res.ok) {
    // Provide the limit value for the paywall modal
    const limit = await getFreeNewChatsPerDay();
    const err = new Error("Over free daily new chat limit");
    err.code = "PAYWALL_REQUIRED";
    err.limit = limit;
    throw err;
  }

  return tid;
}

/** Subscribe to thread messages (ascending by createdAt) */
export function listenMessages(tid, cb) {
  const q = query(
    collection(db, "threads", tid, "messages"),
    orderBy("createdAt", "asc"),
    qlimit(200)
  );
  return onSnapshot(q, (snap) => {
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    cb(list);
  });
}

/** Subscribe to thread metadata (last message, timestamps) */
export function listenThreadMeta(tid, cb) {
  const ref = doc(db, "threads", tid);
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

/** Inbox: subscribe to all threads for a user (ordered by recent activity) */
export function listenThreadsForUser(userUid, cb, limitCount = 50) {
  if (!userUid) return () => {};
  const q = query(
    collection(db, "threads"),
    where("users", "array-contains", userUid),
    orderBy("updatedAt", "desc"),
    qlimit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    cb(list);
  });
}

/** Send a message and update thread's last/timestamps */
export async function sendMessage(tid, text) {
  const me = uid();
  if (!me) throw new Error("Not signed in");
  const clean = String(text || "").trim();
  if (!clean) return;

  const tRef = doc(db, "threads", tid);
  const mCol = collection(tRef, "messages");

  await runTransaction(db, async (tx) => {
    // create message
    const msgRef = await addDoc(mCol, {
      from: me,
      text: clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // update thread meta
    const last = {
      id: msgRef.id,
      text: clean,
      from: me,
      at: serverTimestamp(),
      readBy: { [me]: true },
    };
    tx.update(tRef, {
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      last,
    });
  });
}

/** Mark thread last message as read by uid */
export async function markThreadRead(tid, readerUid) {
  if (!tid || !readerUid) return;
  const tRef = doc(db, "threads", tid);
  await updateDoc(tRef, {
    [`last.readBy.${readerUid}`]: true,
  }).catch(() => {});
}
