// src/services/storage.js
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Upload a public gallery image to:
 *   /public_photos/{uid}/{timestamp}_{safeName}
 * Returns { path, url }
 */
export async function uploadPublicPhoto(uid, file) {
  if (!uid) throw new Error("Missing uid");
  if (!file) throw new Error("Missing file");

  const ts = Date.now();
  const original = file.name || "photo.jpg";
  // Keep letters, digits, dot, underscore, hyphen; replace the rest with "_"
  const safeName = original.replace(/[^A-Za-z0-9._-]/g, "_");

  const path = `public_photos/${uid}/${ts}_${safeName}`;
  const r = ref(storage, path);

  const snap = await uploadBytes(r, file, {
    contentType: file.type || "image/jpeg",
  });
  const url = await getDownloadURL(snap.ref);

  return { path, url };
}
