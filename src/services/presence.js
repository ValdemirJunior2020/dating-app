// src/services/presence.js
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export async function setOnline(online = true) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(
    doc(db, "presence", uid),
    { online: !!online, lastSeen: serverTimestamp(), typingIn: null },
    { merge: true }
  );
}

export async function pulsePresence() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(db, "presence", uid), { lastSeen: serverTimestamp() });
}

export async function setTypingIn(threadIdOrNull) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(
    doc(db, "presence", uid),
    { typingIn: threadIdOrNull || null, lastSeen: serverTimestamp() },
    { merge: true }
  );
}

export function listenPresence(uid, cb) {
  if (!uid) return () => {};
  const ref = doc(db, "presence", uid);
  return onSnapshot(
    ref,
    (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    (_err) => cb(null) // ignore permission errors gracefully
  );
}
