// src/components/ProfileUploader.jsx
import React, { useRef, useState } from "react";
import { storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

/**
 * Props:
 * - value: string | null (current avatar URL)
 * - onChange: (url: string | "") => void
 * - displayName: string (optional, for better alt text)
 */
export default function ProfileUploader({ value = "", onChange, displayName = "" }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    try {
      const path = `avatars/${uuidv4()}-${file.name}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setProgress(pct);
          },
          reject,
          resolve
        );
      });

      const url = await getDownloadURL(task.snapshot.ref);
      onChange?.(url);
    } catch (err) {
      console.error(err);
      alert("Avatar upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearAvatar = () => {
    onChange?.("");
    if (inputRef.current) inputRef.current.value = "";
  };

  // Alt text must NOT include "image", "photo", or "picture".
  // Using "avatar" or the user's name is fine.
  const altText = (displayName ? `${displayName}'s avatar` : "User avatar");

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-3">
        <div
          className="rounded-circle overflow-hidden bg-light d-flex align-items-center justify-content-center"
          style={{ width: 96, height: 96 }}
          aria-label="Current avatar"
        >
          {value ? (
            <img
              src={value}
              alt={altText}
              width={96}
              height={96}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span className="text-muted small">No avatar</span>
          )}
        </div>

        <div className="d-flex flex-column gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onInputChange}
            aria-label="Choose a new avatar"
            disabled={uploading}
          />
          <div className="d-flex gap-2">
            {value && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={clearAvatar}
                aria-label="Remove avatar"
              >
                Remove
              </button>
            )}
            {uploading && (
              <span className="small text-muted" aria-live="polite">
                Uploading… {progress}%
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-muted mb-0">
        For best results, use a clear headshot. You’ll appear in browse once you have at least one photo.
      </p>
    </div>
  );
}
