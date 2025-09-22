// src/services/users.js
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase";

/** ----------------- Profiles ----------------- **/

export async function getMyProfile() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const refDoc = doc(db, "users", uid);
  const snap = await getDoc(refDoc);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Merge partial fields into the user's document.
 * Examples: { displayName }, { bio }, { interests: [...] }
 */
export async function updateMyProfile(partial) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const refDoc = doc(db, "users", uid);
  await setDoc(
    refDoc,
    { ...partial, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** ----------------- Public Photos ----------------- **/

// realtime gallery listener
export function listenMyPublicPhotos(cb) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const col = collection(db, "users", uid, "public_photos");
  const q = query(col, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    cb(items);
  });
}

/**
 * Upload a file to Storage, then create a Firestore doc in:
 * /users/{uid}/public_photos/{pid}
 *
 * NOTE: Firestore rules for public_photos only allow
 * { owner, url, createdAt, updatedAt, caption }.
 * Do NOT write extra fields.
 */
export async function addPublicPhoto(file, { caption = "" } = {}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");

  // Simple limit: max 6 items (change if you want 3)
  const colRef = collection(db, "users", uid, "public_photos");
  const current = await getDocCount(colRef);
  if (current >= 6) {
    throw new Error("You can upload at most 6 photos.");
  }

  const path = `users/${uid}/public/${Date.now()}_${file.name}`;
  const sref = ref(storage, path);
  await uploadBytes(sref, file);
  const url = await getDownloadURL(sref);

  await addDoc(colRef, {
    owner: uid,
    url,
    caption: (caption || "").slice(0, 140),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return url;
}

async function getDocCount(colRef) {
  const snap = await getDocs(colRef);
  return snap.size;
}

export async function deletePublicPhotoDoc(photo) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  if (!photo?.id) throw new Error("Missing photo id");
  // Firestore rules allow owner to delete the doc.
  // (We are not deleting the Storage file here to keep rules simple.)
  await deleteDoc(doc(db, "users", uid, "public_photos", photo.id));
}

/** Optional: mark a photo as main (stores on user doc) */
export async function setMainPhoto(url) {
  await updateMyProfile({ photoURL: url });
}
