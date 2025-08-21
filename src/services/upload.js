// src/services/upload.js
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export function uploadPhotoToUser(uid, file, onProgress) {
  const safe = file.name.replace(/\s+/g, "_");
  const path = `photos/${uid}/${Date.now()}-${safe}`;
  const task = uploadBytesResumable(ref(storage, path), file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => reject(err),
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}
