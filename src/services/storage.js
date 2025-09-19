// src/services/storage.js
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase"; // <-- uses the bucket from firebaseConfig

/**
 * Upload a file to public gallery: public_photos/<uid>/<timestamp_filename>
 * Returns { path, url }.
 */
export async function uploadPublicPhoto(uid, file) {
  if (!uid) throw new Error("Missing uid");
  if (!file) throw new Error("No file selected");

  const safeName = String(file.name || "photo").replace(/[^\w.\-]/g, "_");
  const path = `public_photos/${uid}/${Date.now()}_${safeName}`;
  const r = ref(storage, path);

  await uploadBytes(r, file, {
    contentType: file.type || "application/octet-stream",
  });

  const url = await getDownloadURL(r);
  return { path, url };
}
