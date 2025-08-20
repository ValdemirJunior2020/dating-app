// src/services/match.js
import { db, auth } from "../firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ensureChat } from "./chat";

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

export async function likeUser(targetUid) {
  const myUid = requireUid();
  if (myUid === targetUid) return { status: "self" };

  const likeId = `${myUid}_${targetUid}`;
  await setDoc(doc(db, "likes", likeId), {
    id: likeId,
    fromUid: myUid,
    toUid: targetUid,
    createdAt: Date.now(),
  });

  const reverseId = `${targetUid}_${myUid}`;
  const reverseSnap = await getDoc(doc(db, "likes", reverseId));

  if (reverseSnap.exists()) {
    const matchId = [myUid, targetUid].sort().join("_");
    await setDoc(
      doc(db, "matches", matchId),
      { id: matchId, users: [myUid, targetUid].sort(), createdAt: Date.now() },
      { merge: true }
    );
    await ensureChat(matchId); // <-- make sure chat exists
    return { status: "matched", matchId };
  }

  return { status: "liked" };
}

export async function fetchAlreadyLikedUids() {
  const myUid = requireUid();
  const q = query(collection(db, "likes"), where("fromUid", "==", myUid));
  const snap = await getDocs(q);
  const set = new Set();
  snap.forEach((d) => set.add(d.data().toUid));
  return set;
}
