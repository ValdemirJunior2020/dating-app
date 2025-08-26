// src/services/chat.js
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

/**
 * Ensure a chat doc exists for the given matchId.
 * - Reads matches/{matchId} to verify the current user is a participant
 * - Upserts chats/{matchId} with metadata
 */
export async function ensureChat(matchId) {
  if (!matchId) throw new Error("Missing matchId");
  const me = auth.currentUser?.uid;
  if (!me) throw new Error("Not signed in");

  const matchRef = doc(db, "matches", matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists()) {
    throw new Error("Match not found for matchId=" + matchId);
  }
  const match = matchSnap.data();
  const users = match.users || [];

  if (!users.includes(me)) {
    throw new Error("You are not a participant in this match.");
  }

  const chatRef = doc(db, "chats", matchId);
  // Create/merge the chat metadata
  await setDoc(
    chatRef,
    {
      id: matchId,
      users,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
    },
    { merge: true }
  );

  return chatRef;
}

/**
 * Send a message to chats/{matchId}/messages with fields allowed by rules.
 * Firestore rules typically require senderUid == request.auth.uid.
 */
export async function sendMessage(matchId, text) {
  const me = auth.currentUser?.uid;
  if (!me) throw new Error("Not signed in");
  if (!matchId) throw new Error("Missing matchId");
  const trimmed = (text || "").trim();
  if (!trimmed) return;

  // Make sure chat exists & we are allowed
  await ensureChat(matchId);

  const msgsCol = collection(db, "chats", matchId, "messages");
  const now = serverTimestamp();

  const docRef = await addDoc(msgsCol, {
    text: trimmed,
    senderUid: me,          // REQUIRED by rules
    createdAt: now,
  });

  // Update chat metadata
  await updateDoc(doc(db, "chats", matchId), {
    updatedAt: now,
    lastMessage: {
      text: trimmed,
      senderUid: me,
      at: now,
    },
  });

  return docRef.id;
}

/**
 * Subscribe to messages ordered by createdAt asc.
 * onData receives an array of { id, ...data }
 * Returns the unsubscribe function.
 */
export function subscribeMessages(matchId, onData, onError) {
  if (!matchId) throw new Error("Missing matchId");
  const qy = query(
    collection(db, "chats", matchId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    qy,
    (snap) => {
      const out = [];
      snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
      onData?.(out);
    },
    (err) => {
      console.error("subscribeMessages error:", err);
      onError?.(err);
    }
  );
}
