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
 * Like a user AND immediately ensure a chat exists so the UI can show "Open Chat".
 * If the reverse like already exists, it's a real "match"; otherwise status is "pending".
 * Either way, we return a matchId and the UI can open chat.
 */
export async function likeUser(targetUid) {
  const myUid = requireUid();
  if (myUid === targetUid) return { status: "self" };

  // Record my like (top-level "likes" collection for simplicity)
  const likeId = `${myUid}_${targetUid}`;
  await setDoc(doc(db, "likes", likeId), {
    id: likeId,
    fromUid: myUid,
    toUid: targetUid,
    createdAt: serverTimestamp(),
  });

  // Check if they liked me already
  const reverseId = `${targetUid}_${myUid}`;
  const reverseDoc = await getDoc(doc(db, "likes", reverseId));
  const matched = reverseDoc.exists();

  // Create/merge a match doc so we always have a consistent id to chat on
  const matchId = [myUid, targetUid].sort().join("_");
  await setDoc(
    doc(db, "matches", matchId),
    {
      id: matchId,
      users: [myUid, targetUid].sort(),
      status: matched ? "matched" : "pending",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Ensure a chat thread exists for this match id
  await ensureChat(matchId);

  return { status: matched ? "matched" : "pending", matchId };
}

/** Return UIDs I already liked (helper used in browse filters if needed) */
export async function fetchAlreadyLikedUids() {
  const myUid = requireUid();
  const q = query(collection(db, "likes"), where("fromUid", "==", myUid));
  const snap = await getDocs(q);
  const set = new Set();
  snap.forEach((d) => set.add(d.data().toUid));
  return set;
}

/** Fetch all matches for the current user and include the other user's profile */
export async function fetchUserMatches() {
  const myUid = requireUid();
  const q = query(collection(db, "matches"), where("users", "array-contains", myUid));
  const snap = await getDocs(q);

  const out = [];
  for (const d of snap.docs) {
    const data = d.data();
    const otherUid = data.users.find((u) => u !== myUid);
    const otherSnap = await getDoc(doc(db, "users", otherUid));
    const profile = otherSnap.exists() ? otherSnap.data() : {};
    out.push({
      id: data.id,          // matchId
      otherUid,
      status: data.status,  // "matched" | "pending"
      ...profile,           // name, photos, city, etc.
    });
  }
  return out;
}
