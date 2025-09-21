// src/services/storage.js
import { storage, auth } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

/**
 * Upload a public profile photo for current user.
 * Returns { url, fullPath } on success.
 */
export async function uploadPublicPhoto(file) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const ts = Date.now();
  const safeName = (file?.name || `photo_${ts}.jpg`).replace(/[^\w.-]+/g, "_");
  const fullPath = `public_photos/${user.uid}/${ts}_${safeName}`;
  // eslint-disable-next-line no-console
  console.log("[UPLOAD path]", fullPath);

  const fileRef = ref(storage, fullPath);
  const task = uploadBytesResumable(fileRef, file, {
    contentType: file?.type || "application/octet-stream",
  });

  await new Promise((resolve, reject) => {
    task.on("state_changed", null, reject, resolve);
  });

  const url = await getDownloadURL(fileRef);
  return { url, fullPath };
}

export async function deletePublicPhoto(fullPath) {
  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);
}
