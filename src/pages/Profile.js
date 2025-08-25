// src/pages/Profile.js
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import cleanPhotos from "../utils/cleanPhotos";
import { needsPhotoEncouragement } from "../services/users";

export default function Profile() {
  const uid = auth.currentUser?.uid;
  const [userDoc, setUserDoc] = useState(null);

  useEffect(() => {
    (async () => {
      if (!uid) return;
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setUserDoc({ id: snap.id, ...snap.data() });
    })();
  }, [uid]);

  if (!userDoc) return <div className="container py-5">Loading…</div>;

  const photos = cleanPhotos(userDoc.photos || []);
  const encourage = needsPhotoEncouragement(userDoc);

  return (
    <div className="container py-4">
      <h2 className="mb-3">My Profile</h2>
      {encourage && (
        <div className="alert alert-info">
          Add <strong>{3 - photos.length} more</strong> photo{3 - photos.length === 1 ? "" : "s"} to stand out more.
        </div>
      )}
      {/* ...rest of your profile UI ... */}
    </div>
  );
}
