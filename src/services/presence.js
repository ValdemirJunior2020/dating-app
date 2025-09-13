// src/services/presence.js
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

/** Mark the user online and seed presence doc (idempotent). */
export async function setOnline(online = true) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const ref = doc(db, "presence", uid);
  await setDoc(
    ref,
    { online: !!online, lastSeen: serverTimestamp(), typingIn: null },
    { merge: true }
  );
}

/** Touch lastSeen (use on interval / visibilitychange). */
export async function pulsePresence() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(db, "presence", uid), { lastSeen: serverTimestamp() });
}

/** Set or clear the thread id the user is typing in. */
export async function setTypingIn(threadIdOrNull) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(
    doc(db, "presence", uid),
    { typingIn: threadIdOrNull || null, lastSeen: serverTimestamp() },
    { merge: true }
  );
}

/** Subscribe to a user's presence doc. */
export function listenPresence(uid, cb) {
  if (!uid) return () => {};
  const ref = doc(db, "presence", uid);
  return onSnapshot(ref, (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null));
}
