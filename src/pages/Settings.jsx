// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db, uploadAvatar, ensureUserDoc } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Settings() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [form, setForm] = useState({
    name: "",
    age: "",
    city: "",
    interests: "",
    lookingFor: "",
    photoURL: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    (async () => {
      // make sure doc exists so updateDoc won’t fail later
      await ensureUserDoc(uid, { email: user.email, name: user.displayName || "" });
      const snap = await getDoc(doc(db, "users", uid));
      if (!alive) return;
      if (snap.exists()) {
        const data = snap.data();
        setForm({
          name: data.name || user.displayName || "",
          age: data.age || "",
          city: data.city || "",
          interests: data.interests || "",
          lookingFor: data.lookingFor || "",
          photoURL: data.photoURL || user.photoURL || "",
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

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f || !uid) return;
    try {
      setUploading(true);
      const url = await uploadAvatar(uid, f);
      setForm((s) => ({ ...s, photoURL: url }));
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">Settings</h2>

      <div className="card card-soft p-3 p-md-4">
        {/* Avatar */}
        <div className="d-flex align-items-center mb-3 gap-3">
          {form.photoURL ? (
            <img src={form.photoURL} alt="" className="avatar avatar-lg" />
          ) : (
            <div className="initials avatar-lg bg-primary text-white d-flex align-items-center justify-content-center">
              {String(form.name || user?.email || "?").slice(0,1).toUpperCase()}
            </div>
          )}
          <div>
            <label className="btn btn-outline-secondary btn-sm mb-0">
              {uploading ? "Uploading…" : "Change photo"}
              <input type="file" accept="image/*" hidden onChange={handleFile} />
            </label>
          </div>
        </div>

        {/* Form */}
        <form className="row g-3" onSubmit={handleSave}>
          <div className="col-12">
            <label className="form-label">Name</label>
            <input name="name" className="form-control form-control-lg" value={form.name} onChange={onChange} />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label">Age</label>
            <input name="age" type="number" className="form-control form-control-lg" value={form.age} onChange={onChange} />
          </div>
          <div className="col-6 col-md-3">
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
    </div>
  );
}
