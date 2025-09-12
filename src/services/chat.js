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

function normalizeUid(u) {
  if (!u) return null;
  if (typeof u === "string") return u;
  if (typeof u === "object") return u.uid || u.id || u.userId || null;
  return null;
}

export function threadIdFor(uida, uidb) {
  const [a, b] = [uida, uidb].sort();
  return `${a}_${b}`;
}

export async function ensureThread(other) {
  const me = auth.currentUser?.uid || null;
  const otherUid = normalizeUid(other);
  if (!me || !otherUid || otherUid === me) return null;

  const tid = threadIdFor(me, otherUid);
  const tRef = doc(db, "threads", tid);
  const snap = await getDoc(tRef);
  if (!snap.exists()) {
    await setDoc(tRef, {
      users: [me, otherUid].sort(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    });
    // confirm creation to avoid race with message/query listeners
    await getDoc(tRef);
  }
  return tid;
}

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
