// src/components/PhotoUploader.jsx
import React, { useRef, useState } from "react";
import Lightbox from "./Lightbox";
import { detectFaceInFile } from "../utils/faceCheck";

// ⬇️ use the single initialized Firebase app you already export
import { auth, db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Props:
 *  - value: string[]            // photo URLs
 *  - onChange: (string[]) => void
 *  - max?: number               // default 3
 */
export default function PhotoUploader({ value = [], onChange, max = 3 }) {
  const uid = auth.currentUser?.uid || "anon";

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
    // allow re-selecting the same file next time
    e.target.value = "";
    if (!files.length) return;

    // Enforce max
    if (photos.length >= max) {
      setErr(`Maximum ${max} photos.`);
      return;
    }

    // only process up to remaining slots
    const remaining = Math.max(0, max - photos.length);
    const toProcess = files.slice(0, remaining);

    setBusy(true);
    try {
      const uploadedUrls = [];

      for (const file of toProcess) {
        // Optional: skip images with no visible face (if supported by your util)
        try {
          const face = await detectFaceInFile(file);
          if (face?.supported && face.hasFace === false) {
            setErr("Please upload a photo where a person's face is visible.");
            continue;
          }
        } catch {
          // face check failure shouldn’t block uploads
        }

        // Upload to Storage: user-uploads/{uid}/{timestamp}_{sanitizedFile}
        const safe = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
        const path = `public_photos/${uid}/${Date.now()}_${safe}`;
        const sRef = ref(storage, path);
        await uploadBytes(sRef, file, { contentType: file.type });
        const url = await getDownloadURL(sRef);

        // Create Firestore doc in /users/{uid}/public_photos
        try {
          await addDoc(collection(db, "users", uid, "public_photos"), {
            owner: uid,
            url,
            caption: "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (firestoreErr) {
          // don’t fail the whole flow if doc write fails; keep the image usable
          console.warn("public_photos doc write failed:", firestoreErr);
        }

        uploadedUrls.push(url);
      }

      if (uploadedUrls.length) {
        onChange?.([...photos, ...uploadedUrls]);
      }
    } catch (e1) {
      console.error("PhotoUploader upload:", e1);
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
        <span className="text-muted">
          {photos.length}/{max} {busy ? "· Uploading…" : null}
        </span>
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
                aria-label={`Open upload ${i + 1}`}
                onClick={() => {
                  setViewerStart(i);
                  setViewerOpen(true);
                }}
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
                  alt=""
                  aria-hidden="true"
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
