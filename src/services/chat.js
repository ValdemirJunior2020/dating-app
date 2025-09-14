// src/services/chat.js
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { consumeNewChatCreditOrThrow } from "./limits";

/** Normalize possible user inputs into a UID string */
function normalizeUid(u) {
  if (!u) return null;
  if (typeof u === "string") return u;
  if (typeof u === "object") return u.uid || u.id || u.userId || null;
  return null;
}

/** Deterministic thread id for a pair of UIDs */
export function threadIdFor(uida, uidb) {
  const [a, b] = [uida, uidb].sort();
  return `${a}_${b}`;
}

/**
 * Ensure a thread exists between current user and the other user.
 * Enforces the "new chat per day" limit when creating a brand-new thread.
 */
export async function ensureThread(other) {
  const me = auth.currentUser?.uid || null;
  const otherUid = normalizeUid(other);
  if (!me || !otherUid || otherUid === me) return null;

  const tid = threadIdFor(me, otherUid);
  const tRef = doc(db, "threads", tid);

  // Does it already exist? If yes, just return without consuming a credit.
  const existing = await getDoc(tRef);
  if (existing.exists()) return tid;

  // Brand new conversation -> consume a daily credit (or throw paywall)
  await consumeNewChatCreditOrThrow();

  // Create the thread
  await setDoc(
    tRef,
    {
      users: [me, otherUid].sort(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      last: {
        from: me,
        text: "",
        at: serverTimestamp(),
        readBy: { [me]: true },
      },
    },
    { merge: false }
  );

  return tid;
}

/**
 * Send a message within a thread.
 * Also updates thread.last for read receipts and preview.
 */
export async function sendMessage(tid, text) {
  const me = auth.currentUser?.uid || null;
  if (!me || !tid) return;

  const clean = String(text ?? "").trim();
  if (!clean) return;

  await addDoc(collection(db, "threads", tid, "messages"), {
    from: me,
    text: clean,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "threads", tid), {
    updatedAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    last: {
      from: me,
      text: clean,
      at: serverTimestamp(),
      readBy: { [me]: true },
    },
  });
}

export async function markThreadRead(tid, uid) {
  if (!tid || !uid) return;
  await updateDoc(doc(db, "threads", tid), {
    updatedAt: serverTimestamp(),
    [`last.readBy.${uid}`]: true,
  });
}

export async function sendMessageTo(other, text) {
  const tid = await ensureThread(other);
  if (!tid) return null;
  await sendMessage(tid, text);
  return tid;
}

export function listenMessages(tid, cb) {
  if (!tid) return () => {};
  const c = collection(db, "threads", tid, "messages");
  const qy = query(c, orderBy("createdAt", "asc"));
  return onSnapshot(qy, (snap) => {
    const out = [];
    snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
    cb(out);
  });
}

export function listenThreadMeta(tid, cb) {
  if (!tid) return () => {};
  const tRef = doc(db, "threads", tid);
  return onSnapshot(tRef, (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null));
}

export function listenThreadsForUser(uid, cb) {
  if (!uid) return () => {};
  const tCol = collection(db, "threads");
  const qy = query(tCol, where("users", "array-contains", uid));
  return onSnapshot(qy, (snap) => {
    const out = [];
    snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
    cb(out);
  });
}
