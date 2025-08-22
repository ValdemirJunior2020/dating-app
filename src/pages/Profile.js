// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { auth, db, ensureUserDoc } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

// keep only valid Firebase download URLs
const cleanPhotos = (arr) =>
  (Array.isArray(arr) ? arr : []).filter(
    (u) => typeof u === "string" && u.includes("alt=media")
  );

export default function Profile() {
  const { uid: routeUid } = useParams();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userDoc, setUserDoc] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Which profile to show?
  const effectiveUid = useMemo(
    () => routeUid || auth.currentUser?.uid || null,
    [routeUid]
  );

  const isOwnProfile = useMemo(() => {
    const me = auth.currentUser?.uid;
    return !!me && me === effectiveUid && !routeUid;
  }, [effectiveUid, routeUid]);

  useEffect(() => {
    if (!effectiveUid) return;

    setLoading(true);
    setNotFound(false);

    const ref = doc(db, "users", effectiveUid);
    const unsub = onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          // If you're viewing your own profile and the doc isn't there yet,
          // create a default one so the page has data.
          if (isOwnProfile) {
            await ensureUserDoc(auth.currentUser);
            return; // next onSnapshot tick will have data
          }
          setNotFound(true);
          setUserDoc(null);
        } else {
          const d = snap.data() || {};
          d.photos = cleanPhotos(d.photos);
          setUserDoc(d);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
        setNotFound(true);
      }
    );

    return () => unsub();
  }, [effectiveUid, isOwnProfile]);

  if (!effectiveUid) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">You must be signed in.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-4">
        <div className="placeholder-glow">
          <span className="placeholder col-6"></span>
          <div className="row g-3 mt-3">
            <div className="col-4"><div className="ratio ratio-1x1 bg-light rounded" /></div>
            <div className="col-4"><div className="ratio ratio-1x1 bg-light rounded" /></div>
            <div className="col-4"><div className="ratio ratio-1x1 bg-light rounded" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Profile not found.</div>
      </div>
    );
  }

  const photos = userDoc?.photos || [];
  const displayName = userDoc?.displayName || "Unnamed";
  const about = userDoc?.about || "";
  const email = userDoc?.email || "";

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between">
        <h1 className="h4 mb-0">{displayName}</h1>
        {isOwnProfile ? (
          <span className="badge text-bg-primary">My profile</span>
        ) : (
          <span className="badge text-bg-secondary">Public view</span>
        )}
      </div>
      <div className="text-muted small mt-1">{email}</div>

      {about && <p className="mt-3 mb-4">{about}</p>}

      <h2 className="h6">Photos</h2>
      {photos.length === 0 ? (
        <div className="alert alert-light">
          No photos yet. Go to <strong>Settings</strong> to upload at least 3 photos.
        </div>
      ) : (
        <div className="row g-3">
          {photos.map((url, i) => (
            <div className="col-6 col-sm-4 col-md-3" key={url}>
              <div
                role="button"
                className="ratio ratio-1x1 rounded overflow-hidden border"
                onClick={() => setSelectedPhoto(url)}
                title="Open photo"
              >
                <img
                  src={url}
                  alt={`Profile ${i + 1}`}
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.75)", zIndex: 1050 }}
          onClick={() => setSelectedPhoto(null)}
          role="button"
        >
          <img
            src={selectedPhoto}
            alt="Enlarged profile"
            className="img-fluid rounded shadow"
            style={{ maxHeight: "90vh" }}
          />
        </div>
      )}
    </div>
  );
}
