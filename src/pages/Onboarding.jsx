// src/pages/Onboarding.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import PhotoUploader from "../components/PhotoUploader";
import cleanPhotos from "../utils/cleanPhotos";
import { needsPhotoEncouragement, recomputeVisibility } from "../services/users";

export default function Onboarding() {
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState(null);
  const [saving, setSaving] = useState(false);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    (async () => {
      if (!uid) return;
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUserDoc({ id: snap.id, ...snap.data() });
      } else {
        const base = {
          displayName: auth.currentUser?.displayName || "",
          bio: "",
          photos: [],
          createdAt: Date.now(),
        };
        await setDoc(ref, base);
        setUserDoc({ id: uid, ...base });
      }
      setLoading(false);
    })();
  }, [uid]);

  const photos = cleanPhotos(userDoc?.photos || []);
  const hasMin = photos.length >= 1; // only 1 required
  const showEncouragement = needsPhotoEncouragement(userDoc);

  const handleSave = async () => {
    if (!uid || saving) return;
    setSaving(true);
    try {
      await recomputeVisibility(uid);
      alert(
        hasMin
          ? "Profile saved! You're visible to others now."
          : "Add at least one photo to make your profile visible."
      );
    } catch (e) {
      console.error(e);
      alert("Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container py-5">Loading…</div>;

  return (
    <div className="container py-4">
      <h2 className="mb-3">Finish setting up your profile</h2>

      {!hasMin && (
        <div className="alert alert-warning">
          <strong>Add at least one photo</strong> to make your profile visible.
          Tip: profiles with <strong>3+ photos</strong> get many more matches.
        </div>
      )}

      {showEncouragement && (
        <div className="alert alert-info">
          Looking great! Add <strong>{3 - photos.length} more</strong>{" "}
          photo{3 - photos.length === 1 ? "" : "s"} to boost visibility and trust.
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Photos</h5>
          <p className="text-muted mb-3">
            Minimum <strong>1 photo</strong>. We recommend <strong>3 or more</strong> for best results.
          </p>
          <PhotoUploader
            value={photos}
            onChange={async (newPhotos) => {
              const ref = doc(db, "users", uid);
              await updateDoc(ref, { photos: newPhotos });
              setUserDoc((p) => ({ ...p, photos: newPhotos }));
            }}
          />
        </div>
      </div>

      <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
        {saving ? "Saving…" : "Save & Continue"}
      </button>
    </div>
  );
}
