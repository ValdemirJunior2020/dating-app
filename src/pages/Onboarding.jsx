import React, { useState } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function Onboarding() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    age: "",
    city: "",
    interests: "",
    lookingFor: "",
  });
  const [saving, setSaving] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function save() {
    try {
      if (!user) return alert("Please sign in first.");
      setSaving(true);
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        ...form,
        createdAt: Date.now(),
      });
      alert("Profile saved.");
      setForm({ name: "", age: "", city: "", interests: "", lookingFor: "" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">Onboarding (MVP)</h2>
      <div className="card card-soft p-3 p-md-4">
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label">Name</label>
            <input
              className="form-control form-control-lg"
              name="name"
              autoComplete="name"
              inputMode="text"
              value={form.name}
              onChange={handle}
            />
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label">Age</label>
            <input
              type="number"
              className="form-control form-control-lg"
              name="age"
              inputMode="numeric"
              value={form.age}
              onChange={handle}
            />
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label">City</label>
            <input
              className="form-control form-control-lg"
              name="city"
              autoComplete="address-level2"
              value={form.city}
              onChange={handle}
            />
          </div>

          <div className="col-12">
            <label className="form-label">Interests (comma separated)</label>
            <input
              className="form-control form-control-lg"
              name="interests"
              value={form.interests}
              onChange={handle}
            />
          </div>

          <div className="col-12">
            <label className="form-label">Looking for</label>
            <select
              className="form-select form-select-lg"
              name="lookingFor"
              value={form.lookingFor}
              onChange={handle}
            >
              <option value="">Select...</option>
              <option value="Friendship">Friendship</option>
              <option value="Dating">Dating</option>
              <option value="Long-term">Long‑term</option>
            </select>
          </div>

          <div className="col-12 d-grid">
            <button className="btn btn-primary btn-lg" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
