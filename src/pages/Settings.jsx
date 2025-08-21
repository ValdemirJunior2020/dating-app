// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db, ensureUserDoc } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import PhotoUploader from "../components/PhotoUploader";
import Lightbox from "../components/Lightbox";

export default function Settings() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [form, setForm] = useState({
    name: "",
    age: "",
    city: "",
    interests: "",
    lookingFor: "",
    photos: [],
  });
  const [saving, setSaving] = useState(false);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    (async () => {
      await ensureUserDoc(uid, { email: user.email, name: user.displayName || "" });
      const snap = await getDoc(doc(db, "users", uid));
      if (!alive) return;
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          name: d.name || user.displayName || "",
          age: d.age || "",
          city: d.city || "",
          interests: d.interests || "",
          lookingFor: d.lookingFor || "",
          photos: Array.isArray(d.photos) ? d.photos : [],
        });
      }
    })();
    return () => { alive = false; };
  }, [uid, user]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSave(e) {
    e.preventDefault();
    if (!uid) return;
    try {
      setSaving(true);
      await setDoc(doc(db, "users", uid), { uid, ...form, updatedAt: Date.now() }, { merge: true });
      alert("Profile updated.");
    } catch (err) {
      console.error(err);
      alert("Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  // called after uploads
  function handleUploaded(urls) {
    setForm((s) => ({ ...s, photos: [...(s.photos || []), ...urls] }));
  }

  const needsMore = (form.photos?.length || 0) < 3;

  return (
    <div className="container py-4">
      <h2 className="mb-3">Settings</h2>

      {needsMore && (
        <div className="alert alert-warning">
          Please upload at least <strong>3 photos</strong> to make your profile visible.
        </div>
      )}

      {/* Photo gallery */}
      <div className="card card-soft p-3 mb-3">
        <div className="mb-2"><strong>Your photos</strong></div>
        {form.photos?.length ? (
          <div className="row g-2">
            {form.photos.map((url, i) => (
              <div className="col-4" key={url}>
                <img
                  src={url}
                  alt=""
                  className="w-100 rounded"
                  style={{ aspectRatio: "1/1", objectFit: "cover", cursor: "zoom-in" }}
                  onClick={() => { setLbIndex(i); setLbOpen(true); }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted">No photos yet.</div>
        )}
      </div>

      <PhotoUploader uid={uid} existing={form.photos} onUploaded={handleUploaded} />

      {/* Basic info form */}
      <div className="card card-soft p-3 mt-3">
        <form className="row g-3" onSubmit={handleSave}>
          <div className="col-12">
            <label className="form-label">Name</label>
            <input name="name" className="form-control form-control-lg" value={form.name} onChange={onChange} />
          </div>
          <div className="col-6">
            <label className="form-label">Age</label>
            <input name="age" type="number" className="form-control form-control-lg" value={form.age} onChange={onChange} />
          </div>
          <div className="col-6">
            <label className="form-label">City</label>
            <input name="city" className="form-control form-control-lg" value={form.city} onChange={onChange} />
          </div>
          <div className="col-12">
            <label className="form-label">Interests (comma separated)</label>
            <input name="interests" className="form-control form-control-lg" value={form.interests} onChange={onChange} />
          </div>
          <div className="col-12">
            <label className="form-label">Looking for</label>
            <select name="lookingFor" className="form-select form-select-lg" value={form.lookingFor} onChange={onChange}>
              <option value="">Select…</option>
              <option>Friendship</option>
              <option>Dating</option>
              <option>Long-term</option>
            </select>
          </div>
          <div className="col-12 d-grid">
            <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      {lbOpen && (
        <Lightbox photos={form.photos} start={lbIndex} onClose={() => setLbOpen(false)} />
      )}
    </div>
  );
}
