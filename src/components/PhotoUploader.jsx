import React, { useState } from "react";
import { uploadPhotoToUser } from "../services/upload";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

export default function PhotoUploader({ uid, existing = [], onUploaded }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleUpload() {
    if (!uid || !files.length) return;
    setBusy(true);
    try {
      const newUrls = [];
      for (const f of files) {
        const { url } = await uploadPhotoToUser(uid, f, setProgress);
        newUrls.push(url); // <-- store the URL
      }
      // append to Firestore photos array
      await updateDoc(doc(db, "users", uid), { photos: arrayUnion(...newUrls), updatedAt: Date.now() });
      onUploaded?.(newUrls);
      setFiles([]);
      alert("Photos uploaded!");
    } catch (e) {
      console.error("UPLOAD ERROR", e.code, e.message);
      if (e.code === "storage/unauthenticated") {
        alert("Please sign in again to upload photos.");
      } else if (e.code === "storage/unauthorized") {
        alert("Upload blocked by Storage rules. Check rules/path.");
      } else {
        alert("Upload failed: " + e.message);
      }
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  const minLeft = Math.max(0, 3 - (existing?.length || 0));

  return (
    <div className="card p-3">
      <div className="mb-2">
        <strong>Photos</strong>{" "}
        <small className={minLeft > 0 ? "text-danger" : "text-muted"}>
          {minLeft > 0 ? `Add ${minLeft} more to reach the minimum of 3` : "Minimum reached"}
        </small>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files))}
        className="form-control"
      />

      {busy && (
        <div className="progress my-2">
          <div className="progress-bar" role="progressbar" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}

      <button className="btn btn-primary" disabled={busy || files.length === 0} onClick={handleUpload}>
        {busy ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}
