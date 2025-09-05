// src/components/PhotoUploader.jsx
import React, { useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import Lightbox from "./Lightbox";
import { detectFaceInFile } from "../utils/faceCheck";

/**
 * Props:
 *  - value: string[]            // photo URLs
 *  - onChange: (string[]) => void
 *  - max?: number               // default 6
 */
export default function PhotoUploader({ value = [], onChange, max = 6 }) {
  const auth = getAuth();
  const uid = auth.currentUser?.uid || "anon";
  const storage = getStorage();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStart, setViewerStart] = useState(0);
  const inputRef = useRef(null);

  const photos = Array.isArray(value) ? value.filter(Boolean) : [];

  function openPicker() {
    inputRef.current?.click();
  }

  function removeAt(i) {
    const next = photos.slice();
    next.splice(i, 1);
    onChange?.(next);
  }

  async function handleFiles(e) {
    setErr("");
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    e.target.value = ""; // allow re-selecting same file next time
    if (!files.length) return;

    // Enforce max
    if (photos.length >= max) {
      setErr(`Maximum ${max} photos.`);
      return;
    }

    setBusy(true);
    try {
      const uploads = [];
      for (const file of files) {
        // Simple person check
        const face = await detectFaceInFile(file);
        if (face.supported && face.hasFace === false) {
          setErr("Please upload a photo where a person's face is visible.");
          continue; // skip this file
        }

        // Upload to Storage
        const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
        const path = `user-uploads/${uid}/${Date.now()}_${safe}`;
        const r = ref(storage, path);
        await uploadBytes(r, file, { contentType: file.type });
        const url = await getDownloadURL(r);
        uploads.push(url);
        if (photos.length + uploads.length >= max) break;
      }

      if (uploads.length) {
        onChange?.([...photos, ...uploads]);
      }
    } catch (e) {
      console.error("PhotoUploader upload:", e);
      setErr("Upload failed. Try a different image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Controls row */}
      <div className="d-flex align-items-center gap-3 mb-2">
        <button
          type="button"
          className="btn p-0"
          onClick={openPicker}
          style={{
            background: "transparent",
            color: "#000",
            textDecoration: "underline",
            fontWeight: 600,
          }}
        >
          + Add picture
        </button>
        {busy && <span className="text-muted">Uploading…</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
      />

      {err && <div className="alert alert-danger py-2">{err}</div>}

      {/* Grid of circular thumbnails */}
      {photos.length ? (
        <div className="d-flex flex-wrap gap-3">
          {photos.map((src, i) => (
            <div key={src} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => { setViewerStart(i); setViewerOpen(true); }}
                title="Click to enlarge"
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  overflow: "hidden",
                  padding: 0,
                  border: "none",
                  cursor: "zoom-in",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                  background: "transparent",
                }}
              >
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </button>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove photo"
                className="btn btn-sm btn-light"
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  lineHeight: "14px",
                  fontWeight: 700,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.25)",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted">No photos yet.</div>
      )}

      {viewerOpen && (
        <Lightbox
          photos={photos}
          start={viewerStart}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
