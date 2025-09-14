// src/services/limits.js
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const DEFAULT_FREE_NEW_CHATS = 3;

export async function getFreeNewChatsPerDay() {
  try {
    const s = await getDoc(doc(db, "config", "app"));
    const v = s.exists() ? s.data()?.freeNewChatsPerDay : null;
    return Number.isFinite(v) ? v : DEFAULT_FREE_NEW_CHATS;
  } catch {
    return DEFAULT_FREE_NEW_CHATS;
  }
}

export function ymd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/**
 * Atomically increments today's "new chat" counter.
 * Throws { code: 'PAYWALL_REQUIRED', limit, current } when limit reached.
 */
export async function consumeNewChatCreditOrThrow(limitOverride) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");

  const limit = Number.isFinite(limitOverride)
    ? limitOverride
    : await getFreeNewChatsPerDay();

  const today = ymd();
  const ref = doc(db, "meters", uid, "daily", today);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists() ? (snap.data().count || 0) : 0;
    if (cur >= limit) {
      const err = new Error("Free daily new-chat limit reached");
      err.code = "PAYWALL_REQUIRED";
      err.limit = limit;
      err.current = cur;
      throw err;
    }
    const next = cur + 1;
    if (snap.exists()) {
      tx.update(ref, { count: next, updatedAt: serverTimestamp() });
    } else {
      tx.set(ref, { count: next, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    return { next, limit };
  });
}
