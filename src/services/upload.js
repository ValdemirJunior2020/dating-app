// src/services/upload.js
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Upload a single file to photos/{uid}/... and return its public download URL.
 */
export function uploadPhotoToUser(uid, file, onProgress) {
  const safe = file.name.replace(/\s+/g, "_");
  const path = `photos/${uid}/${Date.now()}-${safe}`;
  const task = uploadBytesResumable(ref(storage, path), file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path }); // IMPORTANT: use url for display
      }
    );
  });
}
