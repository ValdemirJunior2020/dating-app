// src/pages/Profile.js
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import cleanPhotos from "../utils/cleanPhotos";
import { needsPhotoEncouragement } from "../services/users";
import EditableText from "../components/EditableText";

export default function Profile() {
  const uid = auth.currentUser?.uid;
  const [userDoc, setUserDoc] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      if (!uid) return;
      try {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setUserDoc({ id: snap.id, ...snap.data() });
      } catch (e) {
        console.error("Profile load:", e);
        setError("Failed to load your profile.");
      }
    })();
  }, [uid]);

  if (!userDoc) return <div className="container py-5">Loading…</div>;

  const photos = cleanPhotos(userDoc.photos || []);
  const encourage = needsPhotoEncouragement(userDoc);

  async function saveField(key, val) {
    setError("");
    try {
      const ref = doc(db, "users", uid);
      const payload = {};
      payload[key] = (val || "").trim();
      await updateDoc(ref, payload);
      setUserDoc((prev) => ({ ...prev, ...payload }));
    } catch (e) {
      console.error("Save field:", e);
      setError(e?.message || "Save failed. Try again.");
      throw e; // lets EditableText show its inline error too
    }
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">My Profile</h2>

      {encourage && (
        <div className="alert alert-info">
          Add <strong>{Math.max(0, 3 - photos.length)}</strong>{" "}
          photo{3 - photos.length === 1 ? "" : "s"} to stand out more.
        </div>
      )}

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {/* Editable fields */}
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <EditableText
            label="Display name"
            value={userDoc.displayName || userDoc.name || ""}
            placeholder="Add your name"
            maxLength={40}
            onSave={(v) => saveField("displayName", v)}
          />
          <EditableText
            label="School"
            value={userDoc.school || ""}
            placeholder="e.g., Boston University"
            maxLength={80}
            onSave={(v) => saveField("school", v)}
          />
          <EditableText
            label="Major"
            value={userDoc.major || ""}
            placeholder="e.g., Computer Science"
            maxLength={80}
            onSave={(v) => saveField("major", v)}
          />
        </div>

        <div className="col-12 col-md-6">
          <EditableText
            label="Class year"
            value={userDoc.classYear ? String(userDoc.classYear) : ""}
            placeholder="e.g., 2026"
            maxLength={10}
            onSave={(v) => saveField("classYear", v.replace(/[^\d]/g, "").slice(0, 4))}
          />
          <EditableText
            label="City"
            value={userDoc.city || ""}
            placeholder="e.g., Miami, FL"
            maxLength={60}
            onSave={(v) => saveField("city", v)}
          />
          <EditableText
            label="Pronouns"
            value={userDoc.pronouns || ""}
            placeholder="e.g., she/her"
            maxLength={20}
            onSave={(v) => saveField("pronouns", v)}
          />
        </div>

        <div className="col-12">
          <EditableText
            label="Bio"
            value={userDoc.bio || ""}
            placeholder="Tell people about yourself…"
            multiline
            maxLength={400}
            onSave={(v) => saveField("bio", v)}
          />
        </div>
      </div>
    </div>
  );
}
