// src/services/storage.js
import { getApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storage = getStorage(getApp());

export async function uploadPublicPhoto(uid, file) {
  const safeName = String(file.name || "photo").replace(/\s+/g, "_");
  const path = `public_photos/${uid}/${Date.now()}_${safeName}`;
  const r = ref(storage, path);
  const snap = await uploadBytes(r, file, { contentType: file.type });
  const url = await getDownloadURL(snap.ref);
  return { path, url };
}
