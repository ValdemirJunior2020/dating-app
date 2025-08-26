import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function sendLike(toUid) {
  const me = auth.currentUser;
  if (!me) throw new Error("You must be signed in to like.");
  if (!toUid || toUid === me.uid) return;
  await addDoc(collection(db, "likes"), {
    toUid,
    fromUid: me.uid,
    createdAt: serverTimestamp(),
  });
}
