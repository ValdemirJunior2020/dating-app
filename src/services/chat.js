// src/services/chat.js
import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

/** Ensure a chat doc exists for a matchId (sorted pair "uidA_uidB") */
export async function ensureChat(matchId) {
  const chatRef = doc(db, "chats", matchId);

  let snap = null;
  try {
    snap = await getDoc(chatRef);
  } catch {
    // ignore; we'll create the doc below
  }

  if (!snap || !snap.exists()) {
    await setDoc(chatRef, {
      id: matchId,
      createdAt: serverTimestamp(),
      lastMessageAt: null,
      lastText: null,
      lastFromUid: null,
    });
  }
  return chatRef;
}

/** Send a message into chats/{matchId}/messages and update chat summary */
export async function sendMessage(matchId, fromUid, text) {
  const chatRef = await ensureChat(matchId);
  const messagesRef = collection(chatRef, "messages");

  await addDoc(messagesRef, {
    fromUid,
    text,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    chatRef,
    {
      lastMessageAt: serverTimestamp(),
      lastText: text,
      lastFromUid: fromUid,
    },
    { merge: true }
  );
}

/** Subscribe to full message stream (ascending by time) */
export function subscribeMessages(matchId, cb) {
  const messagesRef = collection(db, "chats", matchId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const rows = [];
    snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
    cb(rows);
  });
}

/** Subscribe to the latest single message for preview */
export function subscribeLastMessage(matchId, cb) {
  const messagesRef = collection(db, "chats", matchId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "desc"), limit(1));
  return onSnapshot(q, (snap) => {
    if (snap.empty) return cb(null);
    const d = snap.docs[0];
    cb({ id: d.id, ...d.data() });
  });
}
