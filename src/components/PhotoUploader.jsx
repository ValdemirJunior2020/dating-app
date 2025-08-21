// src/components/PhotoUploader.jsx
import React, { useState } from "react";
import { uploadPhotos } from "../firebase";

export default function PhotoUploader({ uid, existing = [], onUploaded }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    if (!uid || !files.length) return;
    setBusy(true);
    try {
      const urls = await uploadPhotos(uid, files);
      onUploaded?.(urls);
      setFiles([]);
      alert("Photos uploaded!");
    } catch (e) {
      console.error(e);
      alert("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const minLeft = Math.max(0, 3 - (existing?.length || 0));

  return (
    <div className="card p-3">
      <div className="mb-2">
        <strong>Photos</strong>{" "}
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
        onChange={(e) => setFiles(Array.from(e.target.files))}
        className="form-control"
      />

      <div className="d-flex flex-wrap gap-2 my-2">
        {files.map((f, idx) => (
          <span key={idx} className="badge text-bg-secondary">{f.name}</span>
        ))}
      </div>

      <button className="btn btn-primary" disabled={busy || files.length === 0} onClick={handleUpload}>
        {busy ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}
