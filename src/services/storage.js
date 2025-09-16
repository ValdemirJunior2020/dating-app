// src/services/storage.js
import { getApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const app = getApp();
// Use default storage bound to app.options.storageBucket (must be *.appspot.com)
const storage = getStorage(app);

export async function uploadPublicPhoto(uid, file) {
  if (!uid || !file) throw new Error("Missing uid or file");
  const safe = String(file.name || "photo").replace(/\s+/g, "_");
  const path = `public_photos/${uid}/${Date.now()}_${safe}`;
  const r = ref(storage, path);
  const snap = await uploadBytes(r, file, { contentType: file.type || "image/*" });
  const url = await getDownloadURL(snap.ref);
  return { path, url };
}
