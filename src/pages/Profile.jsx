// src/pages/Profile.jsx
import React, { useState } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { uploadPublicPhoto } from "../services/storage";

export default function Profile() {
  const user = auth.currentUser;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  async function onSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!auth.currentUser) {
      setErr("Please sign in to upload a photo.");
      return;
    }

    try {
      setErr("");
      setBusy(true);

      const { url, fullPath } = await uploadPublicPhoto(file);
      setPhotoUrl(url);

      // Persist to the user's Firestore doc (use both url and path)
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        photoUrl: url,
        photoPath: fullPath,
      });
    } catch (ex) {
      console.error(ex);
      setErr(ex?.message || "Upload failed");
    } finally {
      setBusy(false);
      // reset the input so selecting the same file again retriggers onChange
      e.target.value = "";
    }
  }

  return (
    <main className="container py-4">
      <h1 className="mb-3">Profile</h1>

      <div className="card p-3" style={{ maxWidth: 520 }}>
        <label className="form-label">Profile photo</label>
        <input
          type="file"
          accept="image/*"
          className="form-control"
          onChange={onSelect}
          disabled={busy || !user}
        />

        {busy && <div className="mt-2">Uploading…</div>}
        {err && <div className="mt-2 text-danger">{err}</div>}
        {photoUrl && (
          <div className="mt-3">
            <img
              src={photoUrl}
              alt="profile"
              style={{ maxWidth: "100%", borderRadius: 12 }}
            />
          </div>
        )}

        {!user && (
          <div className="mt-2 text-warning">
            You must be signed in to upload.
          </div>
        )}
      </div>
    </main>
  );
}
