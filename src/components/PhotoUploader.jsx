// src/components/PhotoUploader.jsx
import React, { useState } from "react";
import { uploadPhotoToUser } from "../services/upload";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function PhotoUploader({ uid, existing = [], onUploaded }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleUpload() {
    if (!uid || files.length === 0) return;
    setBusy(true);
    try {
      const urls = [];
      for (const f of files) {
        const { url } = await uploadPhotoToUser(uid, f, setProgress);
        urls.push(url); // store URL only
      }
      await updateDoc(doc(db, "users", uid), {
        photos: arrayUnion(...urls),
        updatedAt: Date.now(),
      });
      onUploaded?.(urls);
      setFiles([]);
    } catch (e) {
      console.error("UPLOAD ERROR", e.code, e.message);
      alert("Upload failed: " + e.message);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  const minLeft = Math.max(0, 3 - (existing?.length || 0));

  return (
    <div className="card p-3">
      <div className="mb-2 d-flex justify-content-between align-items-center">
        <strong>Photos</strong>
        <small className={minLeft > 0 ? "text-danger" : "text-muted"}>
          {minLeft > 0
            ? `Add ${minLeft} more to reach the minimum of 3`
            : "Minimum reached"}
        </small>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        className="form-control"
        onChange={(e) => setFiles(Array.from(e.target.files))}
      />

      {busy && (
        <div className="progress my-2">
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      <button
        className="btn btn-primary mt-2"
        disabled={busy || files.length === 0}
        onClick={handleUpload}
      >
        {busy ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}