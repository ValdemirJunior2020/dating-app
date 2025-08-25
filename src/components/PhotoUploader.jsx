// src/components/PhotoUploader.jsx
import React, { useRef, useState } from "react";
import { auth, db, storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function PhotoUploader() {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function onPick() {
    inputRef.current?.click();
  }

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const me = auth.currentUser;
    if (!me) {
      setError("You must be signed in.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const urls = [];
      for (const file of files) {
        const key = `photos/${me.uid}/${Date.now()}-${file.name}`;
        const fileRef = ref(storage, key);

        await new Promise((resolve, reject) => {
          const task = uploadBytesResumable(fileRef, file, {
            contentType: file.type || "application/octet-stream",
          });
          task.on("state_changed", () => {}, reject, resolve);
        });

        const url = await getDownloadURL(fileRef);
        urls.push(url);
      }

      if (urls.length) {
        await updateDoc(doc(db, "users", me.uid), {
          photos: arrayUnion(...urls),
          updatedAt: Date.now(),
        });
      }

      e.target.value = "";
      alert("Uploaded!");
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="d-none"
        onChange={onFiles}
      />
      <button
        type="button"
        className="btn btn-outline-primary"
        onClick={onPick}
        disabled={busy}
      >
        {busy ? "Uploading…" : "Upload photos"}
      </button>
      {error && <div className="text-danger small mt-2">{error}</div>}
      <div className="form-text">Add clear photos. Min 3 recommended.</div>
    </div>
  );
}
