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
import { db } from "../firebase";

/** Stable thread id for two users */
export function threadIdFor(a, b) {
  const [x, y] = [a, b].sort();
  return `t_${x}_${y}`;
}

/** Ensure a thread doc exists and return its id */
export async function ensureThread(myUid, otherUid) {
  const tid = threadIdFor(myUid, otherUid);
  const tRef = doc(db, "threads", tid);
  const tSnap = await getDoc(tRef);
  if (!tSnap.exists()) {
    await setDoc(tRef, {
      id: tid,
      users: [myUid, otherUid].sort(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      last: null, // { from, to, text, at, readBy: { [uid]: true } }
    });
  }
  return tid;
}

/** Live messages (ascending) */
export function listenMessages(threadId, cb) {
  const msgsRef = collection(db, "threads", threadId, "messages");
  const qy = query(msgsRef, orderBy("createdAt", "asc"));
  return onSnapshot(qy, (snap) => {
    const rows = [];
    snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
    cb(rows);
  });
}

/** Send message + update thread.last (sender marked read) */
export async function sendMessage(threadId, { from, to, text }) {
  const clean = String(text || "").trim();
  if (!clean) return;

  const tRef = doc(db, "threads", threadId);
  const msgsRef = collection(db, "threads", threadId, "messages");

  await addDoc(msgsRef, {
    from,
    to,
    text: clean,
    createdAt: serverTimestamp(),
    readBy: { [from]: true },
  });

  await setDoc(
    tRef,
    {
      last: { from, to, text: clean, at: serverTimestamp(), readBy: { [from]: true } },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Mark last message in a thread as read by uid (for unread badges/dots) */
export async function markThreadRead(threadId, uid) {
  const tRef = doc(db, "threads", threadId);
  await updateDoc(tRef, {
    [`last.readBy.${uid}`]: true,
    updatedAt: serverTimestamp(),
  });
}

/** Listen to all threads for a user (used by unread badges) */
export function listenThreadsForUser(uid, cb) {
  const tCol = collection(db, "threads");
  const qy = query(tCol, where("users", "array-contains", uid));
  return onSnapshot(qy, (snap) => {
    const out = [];
    snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
    cb(out);
  });
}
