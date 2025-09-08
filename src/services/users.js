// src/services/users.js
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";

import { db } from "../firebase";
import cleanPhotos, { cleanPhotos as namedClean } from "../utils/cleanPhotos";

/** Fetch one user's profile by uid */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Visible with >= 1 photo */
export function isProfileVisible(userDoc) {
  const photos = (cleanPhotos || namedClean)(userDoc?.photos || []);
  return photos.length >= 1;
}

/** Nudge if 1–2 photos */
export function needsPhotoEncouragement(userDoc) {
  const photos = (cleanPhotos || namedClean)(userDoc?.photos || []);
  return photos.length > 0 && photos.length < 3;
}

/** Client-side fetch of visible users (demo) */
export async function fetchVisibleUsers() {
  const usersRef = collection(db, "users");
  const snap = await getDocs(usersRef);
  const list = [];
  snap.forEach((d) => {
    const data = d.data();
    if (isProfileVisible(data)) list.push({ id: d.id, ...data });
  });
  return list;
}

/** Optional: persist a boolean 'visible' flag */
export async function recomputeVisibility(uid) {
  if (!uid) return;
  const ref = doc(db, "users", uid);
  const got = await getDoc(ref);
  if (!got.exists()) return;
  const data = got.data();
  const visible = isProfileVisible(data);
  await updateDoc(ref, { visible });
}
