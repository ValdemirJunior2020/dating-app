// src/services/match.js
import { db, auth } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { ensureChat } from "./chat";

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

/**
 * Like a user and upsert a /matches doc + ensure /chats doc.
 * Writes to BOTH /likes/{likeId} AND /users/{uid}/likes/{targetUid}
 * so older code paths continue to work.
 */
export async function likeUser(targetUid) {
  const myUid = requireUid();
  if (!targetUid) throw new Error("Missing targetUid");
  if (myUid === targetUid) return { status: "self" };

  const now = serverTimestamp();

  // 1) Write like at top-level
  const likeId = `${myUid}_${targetUid}`;
  await setDoc(doc(db, "likes", likeId), {
    id: likeId,
    fromUid: myUid,
    toUid: targetUid,
    createdAt: now,
  }, { merge: true });

  // 1b) Mirror like under /users/{uid}/likes/{targetUid}
  await setDoc(doc(db, "users", myUid, "likes", targetUid), {
    fromUid: myUid,
    toUid: targetUid,
    createdAt: now,
  }, { merge: true });

  // 2) Determine if reverse like already exists
  const reverseSnap = await getDoc(doc(db, "likes", `${targetUid}_${myUid}`));
  const matched = reverseSnap.exists();

  // 3) Upsert match (stable id for chat)
  const matchId = [myUid, targetUid].sort().join("_");
  await setDoc(doc(db, "matches", matchId), {
    id: matchId,
    users: [myUid, targetUid].sort(),
    status: matched ? "matched" : "pending",
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  // 4) Ensure a chat exists for this match
  await ensureChat(matchId);

  return { status: matched ? "matched" : "pending", matchId };
}

/** UIDs I already liked (helper) */
export async function fetchAlreadyLikedUids() {
  const myUid = requireUid();
  const q = query(collection(db, "likes"), where("fromUid", "==", myUid));
  const snap = await getDocs(q);
  const set = new Set();
  snap.forEach((d) => set.add(d.data().toUid));
  return set;
}

/** Fetch matches I’m in, hydrated with the other user's profile */
export async function fetchUserMatches() {
  const myUid = requireUid();
  const q = query(collection(db, "matches"), where("users", "array-contains", myUid));
  const snap = await getDocs(q);

  const out = [];
  for (const d of snap.docs) {
    const data = d.data();
    const otherUid = data.users.find((u) => u !== myUid);

    let profile = {};
    try {
      const other = await getDoc(doc(db, "users", otherUid));
      if (other.exists()) profile = other.data();
    } catch (_) {}

    out.push({
      id: data.id,          // matchId
      otherUid,
      status: data.status,  // "pending" | "matched"
      ...profile,           // name, photos, city, etc.
    });
  }
  return out;
}
