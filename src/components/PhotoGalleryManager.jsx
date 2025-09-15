// src/components/PhotoGalleryManager.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { uploadPublicPhoto } from "../services/storage";
import {
  getMyProfile,
  listenMyPublicPhotos,
  addPublicPhoto,
  setMainPhoto,
  deletePublicPhotoDoc,
} from "../services/users";

export default function PhotoGalleryManager() {
  const { user } = useAuth() || {};
  const uid = user?.uid || null;

  const [profile, setProfile] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let stop = false;
    (async () => {
      if (!uid) return;
      const p = await getMyProfile(uid);
      if (!stop) setProfile(p);
    })();
    return () => { stop = true; };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsub = listenMyPublicPhotos(uid, setPhotos);
    return unsub;
  }, [uid]);

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    try {
      setUploading(true);
      const { url } = await uploadPublicPhoto(uid, file);
      await addPublicPhoto(uid, url);
      e.target.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function onSetMain(url) {
    if (!uid || !url) return;
    await setMainPhoto(uid, url);
    alert("Main photo updated.");
  }

  async function onDelete(pid) {
    if (!uid || !pid) return;
    if (!window.confirm("Remove this photo from your gallery?")) return;
    await deletePublicPhotoDoc(uid, pid);
  }

  const mainUrl = profile?.photoURL || "/logo.png";

  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <img
              src={mainUrl}
              alt="Main"
              width={80}
              height={80}
              style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(0,0,0,.1)" }}
            />
            <div className="small text-muted">
              Your main photo (used across the app). Set any gallery photo as main.
            </div>
          </div>

          <label className="btn btn-sm btn-primary mb-0">
            {uploading ? "Uploading…" : "Upload photo"}
            <input type="file" accept="image/*" onChange={onUpload} hidden disabled={uploading} />
          </label>
        </div>

        <hr />

        {photos.length === 0 ? (
          <div className="text-muted small">No photos yet. Upload one to get started.</div>
        ) : (
          <div className="row g-3">
            {photos.map((p) => (
              <div key={p.id} className="col-6 col-md-4 col-lg-3">
                <div className="card h-100">
                  <img src={p.url} alt="" style={{ width: "100%", height: 180, objectFit: "cover" }} />
                  <div className="card-body p-2 d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-primary flex-grow-1" onClick={() => onSetMain(p.url)}>
                      Set as main
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(p.id)}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
