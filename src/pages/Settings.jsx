// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { ensureUserDoc, getUserProfile, updateUserProfile } from "../services/users";
import InterestsSelector from "../components/InterestsSelector";
import PhotoUploader from "../components/PhotoUploader";

export default function Settings() {
  const uid = auth.currentUser?.uid || null;

  // basic profile state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState([]);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        if (!uid) return;

        await ensureUserDoc(uid);
        const { data } = await getUserProfile(uid);

        if (alive && data) {
          setDisplayName(data.displayName || "");
          setBio(data.bio || "");
          setInterests(Array.isArray(data.interests) ? data.interests : []);
          setPhotos(Array.isArray(data.photos) ? data.photos : []);
        }
      } catch (e) {
        console.error("Settings load:", e);
        if (alive) setErr("Failed to load your profile.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [uid]);

  async function onSave(e) {
    e?.preventDefault?.();
    if (!uid) return;

    setSaving(true);
    setErr("");
    setOk("");
    try {
      // Persist everything including freshly uploaded photo URLs + interests.
      await updateUserProfile(uid, {
        displayName: displayName.trim().slice(0, 50),
        bio: bio.trim().slice(0, 300),
        interests: [...new Set((interests || []).map(String).map((s) => s.trim()).filter(Boolean))].slice(0, 30),
        photos: (photos || []).filter(Boolean).slice(0, 12),
      });
      setOk("Saved!");
      // optional: small delay to let user see the toast/message
      setTimeout(() => setOk(""), 1500);
    } catch (e) {
      console.error("Settings save:", e);
      setErr("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!uid) {
    return (
      <div className="container py-4">
        <h2 className="mb-3">Settings</h2>
        <div className="alert alert-warning">Please sign in.</div>
      </div>
    );
  }

  return (
    <main className="container py-4">
      <h2 className="mb-3">Settings</h2>

      {loading ? (
        <div className="text-muted">Loading…</div>
      ) : (
        // NOTE: one top-level <form>. Children (InterestsSelector/PhotoUploader) have no forms.
        <form onSubmit={onSave}>
          {err && <div className="alert alert-danger">{err}</div>}
          {ok && <div className="alert alert-success">{ok}</div>}

          {/* Basic info */}
          <div className="mb-3">
            <label className="form-label fw-bold">Display name</label>
            <input
              className="form-control"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Your name"
            />
            <div className="form-text">{displayName.length}/50</div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold">Bio</label>
            <textarea
              className="form-control"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              placeholder="A few lines about you"
            />
            <div className="form-text">{bio.length}/300</div>
          </div>

          {/* Photos */}
          <div className="mb-4">
            <label className="form-label fw-bold">Photos</label>
            <PhotoUploader value={photos} onChange={setPhotos} max={6} />
          </div>

          {/* Interests */}
          <div className="mb-4">
            <label className="form-label fw-bold">Interests</label>
            <InterestsSelector value={interests} onChange={setInterests} max={30} />
          </div>

          {/* Save */}
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary fw-bold" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <span className="text-muted align-self-center">Your changes are live after save.</span>
          </div>
        </form>
      )}
    </main>
  );
}
