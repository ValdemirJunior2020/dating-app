// src/services/chat.js
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";

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
 * Accepts a uid string OR a user object. Returns the thread id or null.
 * Writes only the keys your rules allow on create: ['users','createdAt','updatedAt','lastMessageAt'].
 */
export async function ensureThread(other) {
  const me = auth.currentUser?.uid || null;
  const otherUid = normalizeUid(other);
  if (!me || !otherUid || otherUid === me) return null;

  const tid = threadIdFor(me, otherUid);
  const tRef = doc(db, "threads", tid);

  try {
    await setDoc(
      tRef,
      {
        users: [me, otherUid].sort(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      },
      { merge: false }
    );
  } catch (_e) {
    // If it already exists or an update is denied, we still proceed with tid.
  }
  return tid;
}

/**
 * Send a message within a thread.
 * Writes only the keys your rules allow on create: ['from','text','createdAt','updatedAt'].
 */
export async function sendMessage(tid, text) {
  const me = auth.currentUser?.uid || null;
  if (!me || !tid) return;

  const clean = String(text ?? "").trim();
  if (!clean) return;

  // 1) Create the message
  await addDoc(collection(db, "threads", tid, "messages"), {
    from: me,
    text: clean,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2) Bump thread timestamps (allowed by rules)
  await updateDoc(doc(db, "threads", tid), {
    updatedAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  });
}

/** Ensure a thread (if needed) and send the message */
export async function sendMessageTo(other, text) {
  const tid = await ensureThread(other);
  if (!tid) return null;
  await sendMessage(tid, text);
  return tid;
}

/** Listen to messages for a thread (ascending by createdAt) */
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

/** Listen to all threads for a user (used by inbox/unread UI) */
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
