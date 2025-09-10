// src/services/users.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
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

/* ---------- Interests helpers ---------- */
function normalizeInterests(x) {
  if (Array.isArray(x)) {
    return [...new Set(x.map(String).map((s) => s.trim()).filter(Boolean))].slice(0, 50);
  }
  if (typeof x === "string") return normalizeInterests(x.split(","));
  if (x && typeof x === "object") return normalizeInterests(Object.keys(x).filter((k) => !!x[k]));
  return [];
}
export function tagsFrom(x) {
  return normalizeInterests(x);
}
export async function saveUserInterests(uid, interests) {
  if (!uid) throw new Error("Missing uid");
  const ref = doc(db, "users", uid);
  const arr = normalizeInterests(interests);
  await setDoc(
    ref,
    { interests: arr, interestsUpdatedAt: serverTimestamp() },
    { merge: true }
  );
  return arr;
}

/* ---------- Phone + notification prefs ---------- */
export async function setUserPhoneAndPrefs(
  uid,
  {
    phone,
    smsOptIn = true,
    emailOptIn = true,
    notifyOnLike = true,
    notifyOnMatch = true,
  }
) {
  if (!uid) throw new Error("Missing uid");
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      phone: String(phone || ""),
      prefs: {
        smsOptIn: !!smsOptIn,
        emailOptIn: !!emailOptIn,
        notifyOnLike: !!notifyOnLike,
        notifyOnMatch: !!notifyOnMatch,
      },
      prefsUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateNotificationPrefs(uid, partialPrefs = {}) {
  if (!uid) throw new Error("Missing uid");
  const ref = doc(db, "users", uid);
  const prefs = {
    smsOptIn: undefined,
    emailOptIn: undefined,
    notifyOnLike: undefined,
    notifyOnMatch: undefined,
    ...partialPrefs,
  };
  await setDoc(
    ref,
    {
      prefs: {
        ...(Object.fromEntries(Object.entries(prefs).filter(([_, v]) => v !== undefined))),
      },
      prefsUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
