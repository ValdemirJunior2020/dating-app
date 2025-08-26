// src/components/PhotoUploader.jsx
import React, { useRef, useState } from "react";
import { auth } from "../firebase";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

/**
 * Props:
 *  - value: string[] (download URLs)
 *  - onChange: (urls: string[]) => void
 */
export default function PhotoUploader({ value = [], onChange }) {
  const uid = auth.currentUser?.uid;
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!uid) {
    return <div className="text-light">Sign in to upload photos.</div>;
  }

  const storage = getStorage();

  function pick() {
    inputRef.current?.click();
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setBusy(true);
    setProgress(0);

    try {
      const uploadedUrls = [];
      for (const file of files) {
        // Optional validation
        if (!file.type.startsWith("image/")) {
          alert(`File ${file.name} is not an image.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is larger than 10MB.`);
          continue;
        }

        const path = `photos/${uid}/${Date.now()}-${file.name}`;
        const ref = storageRef(storage, path);
        const task = uploadBytesResumable(ref, file);

        const url = await new Promise((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) => {
              const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
              setProgress(pct);
            },
            reject,
            async () => {
              try {
                const downloadURL = await getDownloadURL(ref);
                resolve(downloadURL); // includes alt=media&token=...
              } catch (err) {
                reject(err);
              }
            }
          );
        });

        uploadedUrls.push(url);
      }

      // Merge with existing list
      const next = [...value, ...uploadedUrls];
      onChange?.(next);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + (err.message || err.code || "Unknown error"));
    } finally {
      setBusy(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removePhoto(url) {
    // Try deleting the underlying object. It’s okay if it fails (e.g. token URL only).
    try {
      // Extract storage path from downloadURL if possible; otherwise skip delete.
      // downloadURL format: .../o/<encodedPath>?alt=media&token=...
      const m = url.match(/\/o\/([^?]+)\?/);
      if (m) {
        const encoded = m[1]; // e.g. photos%2Fuid%2Ffilename.jpg
        const path = decodeURIComponent(encoded);
        const ref = storageRef(storage, path);
        await deleteObject(ref);
      }
    } catch (e) {
      // Non-fatal: maybe the URL isn't a standard downloadURL or permissions differ.
      console.warn("Could not delete object for URL:", url, e);
    } finally {
      const next = value.filter((u) => u !== url);
      onChange?.(next);
    }
  }

  return (
    <div>
      <div className="d-flex gap-2 mb-2">
        <button
          type="button"
          className="btn btn-outline-light btn-sm"
          onClick={pick}
          disabled={busy}
        >
          {busy ? `Uploading… ${progress}%` : "Add photos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFiles}
        />
      </div>

      {value?.length > 0 ? (
        <div className="d-flex flex-wrap gap-2">
          {value.map((u) => (
            <div
              key={u}
              className="position-relative"
              style={{ width: 110, height: 110 }}
            >
              <img
                src={u}
                alt=""
                style={{
                  width: "110px",
                  height: "110px",
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              />
              <button
                type="button"
                className="btn btn-sm btn-danger position-absolute"
                style={{ top: 4, right: 4 }}
                onClick={() => removePhoto(u)}
                disabled={busy}
                aria-label="Remove photo"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-light m-0">No photos yet.</p>
      )}
    </div>
  );
}
