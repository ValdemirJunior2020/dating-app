// src/services/discover.js
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Find users who share any of the selected interests.
 * - selected: string[]
 * - options.excludeUid: string | null (filters out current user)
 * - options.max: number (default 30)
 *
 * Firestore constraint: array-contains-any supports up to 10 values.
 */
export async function findUsersByInterests(
  selected = [],
  { excludeUid = null, max = 30 } = {}
) {
  if (!selected?.length) return [];

  const usersCol = collection(db, "users");
  const any = selected.slice(0, 10);
  const q = query(usersCol, where("interests", "array-contains-any", any), limit(max));
  const snap = await getDocs(q);

  const results = [];
  snap.forEach((docSnap) => {
    if (excludeUid && docSnap.id === excludeUid) return;
    results.push({ id: docSnap.id, ...docSnap.data() });
  });

  return results;
}
