// src/services/limits.js
// Daily new-chat limits + small helpers

import { doc, getDoc, runTransaction, serverTimestamp, increment, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const DEFAULT_FREE_NEW_CHATS = 3;

/** YYYY-MM-DD (local time) */
export function ymd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Read /config/app.freeNewChatsPerDay (fallback DEFAULT_FREE_NEW_CHATS) */
export async function getFreeNewChatsPerDay() {
  try {
    const s = await getDoc(doc(db, "config", "app"));
    const v = s.exists() ? Number(s.data()?.freeNewChatsPerDay ?? DEFAULT_FREE_NEW_CHATS) : DEFAULT_FREE_NEW_CHATS;
    return Number.isFinite(v) && v > 0 ? v : DEFAULT_FREE_NEW_CHATS;
  } catch {
    return DEFAULT_FREE_NEW_CHATS;
  }
}

/** Return boolean whether user is premium (simple flag you can set on users/{uid}) */
export async function isPremium(uid) {
  try {
    const s = await getDoc(doc(db, "users", uid));
    if (!s.exists()) return false;
    const d = s.data() || {};
    // You can adapt these keys later to your webhook/extension mapping
    return !!(d.premium || d.subscription?.active || d.roles?.premium);
  } catch {
    return false;
  }
}

/** Get today's counter value */
export async function getDailyNewChats(uid) {
  const s = await getDoc(doc(db, "meters", uid, "daily", ymd()));
  return s.exists() ? Number(s.data()?.count || 0) : 0;
}

/** Atomically +1 today's counter (creates doc if missing) */
export async function incDailyNewChats(uid) {
  const ref = doc(db, "meters", uid, "daily", ymd());
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, { count: 1, date: ymd(), updatedAt: serverTimestamp(), createdAt: serverTimestamp() });
    } else {
      tx.update(ref, { count: increment(1), date: ymd(), updatedAt: serverTimestamp() });
    }
  });
}

/**
 * Gate: check within a transaction against /config/app and today's meter.
 * Returns { allowed: boolean, limit: number, count: number }
 */
export async function txCheckAndMaybeIncNewChat(uid, create) {
  const cfgRef = doc(db, "config", "app");
  const meterRef = doc(db, "meters", uid, "daily", ymd());

  return runTransaction(db, async (tx) => {
    const [cfgSnap, meterSnap] = await Promise.all([tx.get(cfgRef), tx.get(meterRef)]);
    const limit = Number(cfgSnap.exists() ? cfgSnap.data()?.freeNewChatsPerDay ?? DEFAULT_FREE_NEW_CHATS : DEFAULT_FREE_NEW_CHATS) || DEFAULT_FREE_NEW_CHATS;
    const count = meterSnap.exists() ? Number(meterSnap.data()?.count || 0) : 0;

    if (!create) {
      return { allowed: count < limit, limit, count };
    }

    if (!meterSnap.exists()) {
      tx.set(meterRef, { count: 1, date: ymd(), updatedAt: serverTimestamp(), createdAt: serverTimestamp() });
      return { allowed: true, limit, count: 1 };
    } else {
      if (count >= limit) return { allowed: false, limit, count };
      tx.update(meterRef, { count: increment(1), date: ymd(), updatedAt: serverTimestamp() });
      return { allowed: true, limit, count: count + 1 };
    }
  });
}

/** Ensure the meters/{uid}/daily doc exists (useful for UI dashboards) */
export async function ensureTodayMeter(uid) {
  const ref = doc(db, "meters", uid, "daily", ymd());
  const s = await getDoc(ref);
  if (!s.exists()) {
    await setDoc(ref, { count: 0, date: ymd(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
}
