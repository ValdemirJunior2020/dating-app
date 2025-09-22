// src/pages/Settings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";
import {
  getMyProfile,
  updateMyProfile,
  listenMyPublicPhotos,
  addPublicPhoto,
  deletePublicPhotoDoc,
  setMainPhoto,
} from "../services/users";
import InterestsSelector, { INTEREST_CATALOG } from "../components/InterestsSelector";

export default function Settings() {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // profile fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState([]);

  // gallery
  const [photos, setPhotos] = useState([]);
  const maxPhotos = 6; // change to 3 if you want a lower max

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      setLoading(true);
      try {
        const p = await getMyProfile();
        if (p) {
          setDisplayName(p.displayName || "");
          setBio(p.bio || "");
          setInterests(Array.isArray(p.interests) ? p.interests : []);
        }
        unsub = listenMyPublicPhotos(setPhotos);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => unsub();
  }, []);

  function compactStrings(arr) {
    return (arr || [])
      .map((x) => (x || "").trim())
      .filter(Boolean);
  }

  async function onSaveProfile(e) {
    e?.preventDefault?.();
    setSaving(true);
    try {
      await updateMyProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        interests: compactStrings(interests).slice(0, 30),
      });
      alert("Profile saved!");
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = maxPhotos - photos.length;
    const batch = files.slice(0, Math.max(0, remaining));
    if (!batch.length) {
      alert(`You already have ${photos.length}. Max is ${maxPhotos}.`);
      return;
    }

    try {
      for (const f of batch) {
        await addPublicPhoto(f);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Upload failed.");
    } finally {
      e.target.value = "";
    }
  }

  const canAddMore = photos.length < maxPhotos;
  const minPhotosNote = useMemo(() => {
    const need = Math.max(0, 3 - photos.length);
    return need > 0 ? `Add at least ${need} more to reach 3.` : "Nice!";
  }, [photos.length]);

  if (!user) return <div className="container py-4">Sign in first.</div>;
  if (loading) return <div className="container py-4">Loading…</div>;

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <h2 className="mb-3">Edit Profile</h2>

      {/* Basic info */}
      <form onSubmit={onSaveProfile} className="card mb-4" style={{ padding: 16, borderRadius: 14 }}>
        <div className="mb-3">
          <label className="form-label fw-bold">Display name</label>
          <input
            className="form-control"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Bio</label>
          <textarea
            className="form-control"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            placeholder="Say hi 👋 — classes, hobbies, what you’re looking for…"
          />
          <div className="form-text">{bio.length}/200</div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Interests</label>
          <InterestsSelector
            value={interests}
            onChange={setInterests}
            suggestions={INTEREST_CATALOG}
            max={30}
          />
        </div>

        <button disabled={saving} className="btn btn-primary fw-bold" type="submit">
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </form>

      {/* Photos */}
      <div className="card" style={{ padding: 16, borderRadius: 14 }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="m-0">Public Photos</h5>
          <div className="small text-muted">
            {photos.length}/{maxPhotos} — {minPhotosNote}
          </div>
        </div>

        <div className="mt-3">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onUpload}
            disabled={!canAddMore}
            className="form-control"
          />
          {!canAddMore && (
            <div className="small text-warning mt-2">
              You’ve reached the maximum of {maxPhotos} photos.
            </div>
          )}
        </div>

        <div
          className="mt-3"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}
        >
          {photos.map((p) => (
            <div key={p.id} className="card" style={{ borderRadius: 12, overflow: "hidden" }}>
              <div style={{ position: "relative", paddingTop: "100%", background: "#111" }}>
                {/* square thumb */}
                <img
                  src={p.url}
                  alt=""
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div className="p-2 d-flex" style={{ gap: 8 }}>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={async () => {
                    if (window.confirm("Delete this photo?")) {
                      try {
                        await deletePublicPhotoDoc(p);
                      } catch (e) {
                        alert(e.message || "Delete failed");
                      }
                    }
                  }}
                >
                  Delete
                </button>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={async () => {
                    try {
                      await setMainPhoto(p.url);
                      alert("Set as main photo");
                    } catch (e) {
                      alert(e.message || "Action failed");
                    }
                  }}
                >
                  Set main
                </button>
              </div>
            </div>
          ))}
          {photos.length === 0 && (
            <div className="text-muted">No photos yet — add a few to get better matches.</div>
          )}
        </div>
      </div>
    </div>
  );
}
