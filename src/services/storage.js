// src/services/storage.js
import { storage, auth } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/**
 * Uploads a File to: public_photos/{uid}/{timestamp}_{safeName}
 * Resolves { url, fullPath }.
 */
export function uploadPublicPhoto(file) {
  const user = auth.currentUser;
  if (!user) throw new Error("Must be signed in to upload");
  if (!file) throw new Error("No file selected");

  const uid = user.uid;
  const ts = Date.now();
  // Put '-' at end of the class so no escape needed; fixes ESLint "unnecessary escape"
  const safeName = (file.name || `photo_${ts}.jpg`).replace(/[^\w.-]+/g, "_");
  const fullPath = `public_photos/${uid}/${ts}_${safeName}`;
  const fileRef = ref(storage, fullPath);
  const metadata = { contentType: file.type || "application/octet-stream" };

  const task = uploadBytesResumable(fileRef, file, metadata);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      // progress callback optional; provide if you want a progress bar
      undefined,
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, fullPath });
      }
    );
  });
}
