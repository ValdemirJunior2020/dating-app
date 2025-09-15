// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

import { uploadPublicPhoto } from "../services/storage";
import {
  getMyProfile,
  updateMyProfile,
  listenMyPublicPhotos,
  addPublicPhoto,
  setMainPhoto,
  deletePublicPhotoDoc,
} from "../services/users";

const MAX_BIO = 280;

function Avatar({ url, size = 120 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        border: "4px solid rgba(255,255,255,.7)",
        background: "#1b1b1b",
        boxShadow: "0 10px 28px rgba(0,0,0,.35)",
      }}
    >
      <img
        src={url || "/logo.png"}
        alt="avatar"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth() || {};
  const uid = user?.uid || null;

  // profile fields
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");

  // gallery
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // load my profile
  useEffect(() => {
    let stop = false;
    (async () => {
      if (!uid) return;
      const p = await getMyProfile(uid);
      if (stop) return;
      setProfile(p);
      setDisplayName(p?.displayName || "");
      setBio(p?.bio || "");
      setSchool(p?.school || "");
      setGender(p?.gender || "");
      setAge(p?.age || "");
    })();
    return () => {
      stop = true;
    };
  }, [uid]);

  // listen to my public photos
  useEffect(() => {
    if (!uid) return;
    const unsub = listenMyPublicPhotos(uid, setPhotos);
    return unsub;
  }, [uid]);

  const mainUrl = profile?.photoURL || null;
  const bioLeft = useMemo(() => Math.max(0, MAX_BIO - (bio?.length || 0)), [bio]);

  async function onSave(e) {
    e.preventDefault();
    if (!uid || saving) return;
    try {
      setSaving(true);
      const clean = {
        displayName: (displayName || "").trim(),
        bio: (bio || "").slice(0, MAX_BIO),
        school: (school || "").trim(),
        gender: (gender || "").trim(),
        age: age ? Number(age) : "",
      };
      await updateMyProfile(uid, clean);
      alert("Profile saved.");
    } catch (err) {
      console.error(err);
      alert(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function onUploadToGallery(e) {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    try {
      setUploading(true);
      const { url } = await uploadPublicPhoto(uid, file);
      await addPublicPhoto(uid, url);
      e.target.value = ""; // reset input
    } catch (err) {
      console.error(err);
      alert(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  }

  async function onSetMain(url) {
    if (!uid || !url) return;
    try {
      await setMainPhoto(uid, url);
      alert("Main photo updated.");
    } catch (err) {
      console.error(err);
      alert(err?.message || String(err));
    }
  }

  async function onDelete(pid) {
    if (!uid || !pid) return;
    if (!window.confirm("Remove this photo from your gallery? (Storage file is not deleted)")) return;
    try {
      await deletePublicPhotoDoc(uid, pid);
    } catch (err) {
      console.error(err);
      alert(err?.message || String(err));
    }
  }

  return (
    <div className="container py-3">
      <h4 className="fw-bold mb-3">Your Profile</h4>

      {/* Main avatar + quick upload */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex align-items-center gap-3 flex-wrap">
          <Avatar url={mainUrl} size={120} />
          <div className="flex-grow-1">
            <div className="fw-bold mb-1">{displayName || profile?.email || "Your name"}</div>
            <div className="text-muted small mb-2">This photo is shown across the app.</div>
            <label className="btn btn-sm btn-outline-primary mb-0">
              {uploading ? "Uploading…" : "Upload to gallery"}
              <input
                type="file"
                accept="image/*"
                onChange={onUploadToGallery}
                hidden
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Edit fields */}
      <form onSubmit={onSave} className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Display name</label>
              <input
                className="form-control"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">School</label>
              <input
                className="form-control"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Where you study"
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Gender</label>
              <input
                className="form-control"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="Gender"
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Age</label>
              <input
                type="number"
                min="16"
                max="120"
                className="form-control"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">
                Bio <span className="text-muted small">({bioLeft} left)</span>
              </label>
              <textarea
                className="form-control"
                rows={4}
                maxLength={MAX_BIO}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about you…"
              />
            </div>
          </div>
        </div>
        <div className="card-footer d-flex justify-content-end">
          <button className="btn btn-primary fw-bold" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>

      {/* Gallery */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-bold">Your gallery</div>
            <label className="btn btn-sm btn-outline-secondary mb-0">
              {uploading ? "Uploading…" : "Add photo"}
              <input
                type="file"
                accept="image/*"
                onChange={onUploadToGallery}
                hidden
                disabled={uploading}
              />
            </label>
          </div>

          {photos.length === 0 && (
            <div className="text-muted small">No photos yet. Upload a photo to get started.</div>
          )}

          <div className="row g-3">
            {photos.map((p) => (
              <div key={p.id} className="col-6 col-md-4 col-lg-3">
                <div className="card h-100">
                  <img src={p.url} alt="" style={{ width: "100%", height: 180, objectFit: "cover" }} />
                  <div className="card-body p-2 d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-primary flex-grow-1" onClick={() => onSetMain(p.url)}>
                      Set as main
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(p.id)} title="Remove from gallery">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-muted small mt-2">
            Tip: “Set as main” updates the <code>photoURL</code> in your profile.
          </div>
        </div>
      </div>
    </div>
  );
}
