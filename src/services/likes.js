// src/services/likes.js
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

export function likeIdFor(fromUid, toUid) {
  const a = String(fromUid);
  const b = String(toUid);
  return `${a}_${b}`;
}

/** Create a like from current user to target (idempotent). */
export async function likeUser(targetUid) {
  const me = auth.currentUser?.uid || null;
  if (!me || !targetUid || targetUid === me) return;

  const id = likeIdFor(me, targetUid);
  const ref = doc(db, "likes", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      from: me,
      to: targetUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/** Remove a like created by current user (safe if it doesn't exist). */
export async function unlikeUser(targetUid) {
  const me = auth.currentUser?.uid || null;
  if (!me || !targetUid || targetUid === me) return;

  const id = likeIdFor(me, targetUid);
  const ref = doc(db, "likes", id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
  }
}

/** Check if current user liked target. */
export async function hasLiked(targetUid) {
  const me = auth.currentUser?.uid || null;
  if (!me || !targetUid || targetUid === me) return false;

  const id = likeIdFor(me, targetUid);
  const ref = doc(db, "likes", id);
  const snap = await getDoc(ref);
  return snap.exists();
}

/** Listen to incoming likes for a user (people who liked me). */
export function listenIncomingLikes(uid, cb) {
  if (!uid) return () => {};
  const qy = query(collection(db, "likes"), where("to", "==", uid));
  return onSnapshot(qy, (snap) => {
    const out = [];
    snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
    cb(out);
  });
}

/** Listen to likes I sent (people I liked). */
export function listenSentLikes(uid, cb) {
  if (!uid) return () => {};
  const qy = query(collection(db, "likes"), where("from", "==", uid));
  return onSnapshot(qy, (snap) => {
    const out = [];
    snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
    cb(out);
  });
}

/* ---- Aliases to match existing imports in your app ---- */
export const sendLike = likeUser;        // some components import { sendLike }
export const removeLike = unlikeUser;    // in case { removeLike } is imported
export const sendUnlike = unlikeUser;    // in case { sendUnlike } is imported
export const getLikeId = likeIdFor;      // utility if referenced elsewhere
