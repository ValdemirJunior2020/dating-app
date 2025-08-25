import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import PhotoUploader from "../components/PhotoUploader";
import cleanPhotos from "../utils/cleanPhotos";
import { needsPhotoEncouragement, recomputeVisibility } from "../services/users";

export default function Settings() {
  const uid = auth.currentUser?.uid;
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState(null);

  useEffect(() => {
    (async () => {
      if (!uid) return;
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setUserDoc({ id: snap.id, ...snap.data() });
      setLoading(false);
    })();
  }, [uid]);

  if (loading) return <div className="container py-5">Loading…</div>;
  const photos = cleanPhotos(userDoc?.photos || []);
  const encourage = needsPhotoEncouragement(userDoc);

  const save = async () => {
    if (!uid) return;
    await recomputeVisibility(uid);
    alert("Settings saved!");
  };

  return (
    <div className="container py-4 settings-page">
      <h2 className="mb-3">Settings</h2>

      {encourage && (
        <div className="alert alert-info">
          Add <strong>{3 - photos.length} more</strong>{" "}
          photo{3 - photos.length === 1 ? "" : "s"} to improve match rate.
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Your Photos</h5>
          <p className="text-muted">
            Minimum 1 photo to be visible. 3+ recommended.
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

      <button className="btn btn-primary" onClick={save}>
        Save
      </button>
    </div>
  );
}
