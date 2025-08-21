// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import PhotoUploader from "../components/PhotoUploader";
import { cleanPhotos } from "../utils/cleanPhotos";

export default function Settings() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    photos: [],
  });
  const [saving, setSaving] = useState(false);

  // Load user profile
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          displayName: d.displayName || user.displayName || "",
          bio: d.bio || "",
          photos: cleanPhotos(d.photos),
        });
      } else {
        setForm((s) => ({
          ...s,
          displayName: user.displayName || "",
          photos: [],
        }));
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const needMore = (form.photos?.length || 0) < 3;

  function handleUploaded(newUrls) {
    setForm((s) => ({
      ...s,
      photos: cleanPhotos([...(s.photos || []), ...newUrls]),
    }));
  }

  async function handleSave() {
    if (!user) return;
    if (needMore) {
      alert("Please upload at least 3 photos before saving your profile.");
      return;
    }
    try {
      setSaving(true);
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email || "",
          displayName: form.displayName || "",
          bio: form.bio || "",
          photos: cleanPhotos(form.photos),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      alert("Profile saved!");
    } catch (e) {
      console.error(e);
      alert("Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">Settings</h2>

      {needMore && (
        <div className="alert alert-warning">
          Please upload at least <strong>3 photos</strong> to complete your
          profile and be visible in Browse.
        </div>
      )}

      <div className="card p-3 mb-3">
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label">Display Name</label>
            <input
              className="form-control"
              value={form.displayName}
              onChange={(e) =>
                setForm((s) => ({ ...s, displayName: e.target.value }))
              }
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Email</label>
            <input
              className="form-control"
              value={auth.currentUser?.email || ""}
              readOnly
            />
          </div>
          <div className="col-12">
            <label className="form-label">Bio</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.bio}
              onChange={(e) =>
                setForm((s) => ({ ...s, bio: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="card p-3 mb-3">
        <div className="mb-2">
          <strong>Your photos</strong>
        </div>
        {form.photos?.length ? (
          <div className="row g-2">
            {form.photos.map((url, i) => (
              <div className="col-4 col-sm-3 col-md-2" key={url}>
                <img
                  src={url}
                  alt={`photo-${i}`}
                  className="w-100 rounded"
                  style={{ aspectRatio: "1/1", objectFit: "cover", cursor: "zoom-in" }}
                  onClick={() => window.open(url, "_blank")}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted">No photos uploaded</div>
        )}
      </div>

      {/* Uploader */}
      <PhotoUploader
        uid={user?.uid}
        existing={form.photos}
        onUploaded={handleUploaded}
      />

      <div className="mt-3">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSave}
          disabled={saving || needMore}
          title={needMore ? "Upload at least 3 photos to enable saving" : ""}
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}