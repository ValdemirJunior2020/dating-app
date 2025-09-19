// src/components/PhotoUploader.jsx
import React, { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase"; // <-- use shared instance bound to the correct bucket

export default function PhotoUploader({ uid, onUploaded }) {
  const [busy, setBusy] = useState(false);

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file || !uid || busy) return;
    try {
      setBusy(true);
      const safe = String(file.name || "photo").replace(/[^\w.\-]/g, "_");
      const path = `public_photos/${uid}/${Date.now()}_${safe}`;
      const r = ref(storage, path);
      await uploadBytes(r, file, { contentType: file.type || "application/octet-stream" });
      const url = await getDownloadURL(r);
      onUploaded?.({ path, url });
      e.target.value = ""; // reset input
    } catch (err) {
      console.error(err);
      alert(err?.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="btn btn-sm btn-outline-primary mb-0">
      {busy ? "Uploading…" : "Upload photo"}
      <input type="file" accept="image/*" hidden disabled={busy} onChange={onPick} />
    </label>
  );
}
