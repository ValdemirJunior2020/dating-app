// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import PhotoUploader from "../components/PhotoUploader";
import InterestsSelector from "../components/InterestsSelector";

export default function Settings() {
  const uid = auth.currentUser?.uid || null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState([]); // URLs
  const [interests, setInterests] = useState([]);

  // pull user doc
  useEffect(() => {
    let stop = false;
    async function run() {
      try {
        if (!uid) return;
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        if (stop) return;
        if (snap.exists()) {
          const d = snap.data() || {};
          setDisplayName(d.displayName || "");
          setBio(d.bio || "");
          setPhotos(Array.isArray(d.photos) ? d.photos.filter(Boolean) : []);
          setInterests(Array.isArray(d.interests) ? d.interests : []);
        } else {
          await setDoc(ref, {
            displayName: "",
            bio: "",
            photos: [],
            interests: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (e) {
        console.error("Settings load:", e);
        setErr("Failed to load settings.");
      } finally {
        if (!stop) setLoading(false);
      }
    }
    run();
    return () => {
      stop = true;
    };
  }, [uid]);

  async function onSave(e) {
    e?.preventDefault?.();
    if (!uid) return;
    setErr("");
    setSaving(true);
    try {
      const ref = doc(db, "users", uid);
      await updateDoc(ref, {
        displayName: displayName || "",
        bio: bio || "",
        photos: Array.isArray(photos) ? photos.slice(0, 12) : [],
        interests: Array.isArray(interests) ? interests.slice(0, 30) : [],
        updatedAt: serverTimestamp(),
      });
      alert("Saved!");
    } catch (e) {
      console.error("Settings save:", e);
      setErr("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!uid) {
    return (
      <div className="container py-4">
        <h2>Settings</h2>
        <div className="alert alert-warning">Please sign in.</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">Settings</h2>
      {loading && <div className="text-muted">Loading…</div>}
      {err && <div className="alert alert-danger">{err}</div>}

      {!loading && (
        <form onSubmit={onSave}>
          {/* Basic info */}
          <div className="mb-3">
            <label className="form-label fw-bold">Display name</label>
            <input
              className="form-control"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold">Bio</label>
            <textarea
              className="form-control"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
            />
          </div>

          {/* Photos */}
          <div className="mb-4">
            <label className="form-label fw-bold">Photos</label>
            <PhotoUploader value={photos} onChange={setPhotos} max={3} />
          </div>

          {/* Interests */}
          <div className="mb-4">
            <label className="form-label fw-bold">Interests</label>
            <InterestsSelector value={interests} onChange={setInterests} max={30} />
          </div>

          <button type="submit" className="btn btn-primary fw-bold" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}
