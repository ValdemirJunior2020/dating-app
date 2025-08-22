// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { validateProfile } from "../utils/moderation";

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

  // edit state
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ displayName: "", bio: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const effectiveUid = useMemo(() => {
    return routeUid || auth.currentUser?.uid || null;
  }, [routeUid]);

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
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          setUserDoc(null);
        } else {
          const d = snap.data() || {};
          d.photos = cleanPhotos(d.photos);
          setUserDoc(d);

          if (!isEditing) {
            setForm({
              displayName: d.displayName || "",
              bio: d.about || d.bio || "",
            });
          }
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
        setNotFound(true);
      }
    );

    return () => unsub();
  }, [effectiveUid, isEditing]);

  async function handleSave(e) {
    e.preventDefault();
    setErrors({});
    const check = validateProfile({
      displayName: form.displayName,
      bio: form.bio,
    });

    if (!check.ok) {
      setErrors(check.errors);
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, "users", effectiveUid), {
        displayName: check.values.displayName,
        about: check.values.bio, // store under "about" (or change to "bio" if you prefer)
        updatedAt: Date.now(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setErrors({ _global: "Could not save changes. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (!effectiveUid) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          You must be signed in to view your profile.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-4">
        <div className="placeholder-glow">
          <span className="placeholder col-6"></span>
          <div className="row g-3 mt-3">
            <div className="col-4">
              <div className="ratio ratio-1x1 bg-light rounded"></div>
            </div>
            <div className="col-4">
              <div className="ratio ratio-1x1 bg-light rounded"></div>
            </div>
            <div className="col-4">
              <div className="ratio ratio-1x1 bg-light rounded"></div>
            </div>
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
  const about = userDoc?.about || userDoc?.bio || "";
  const email = userDoc?.email || "";

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between">
        <h1 className="h4 mb-0">{displayName}</h1>
        {isOwnProfile ? (
          <div className="d-flex align-items-center gap-2">
            <span className="badge text-bg-primary">My profile</span>
            {!isEditing && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
          </div>
        ) : (
          <span className="badge text-bg-secondary">Public view</span>
        )}
      </div>

      <div className="text-muted small mt-1">{email}</div>

      {/* EDIT FORM (owner only) */}
      {isOwnProfile && isEditing ? (
        <form className="mt-4" onSubmit={handleSave} noValidate>
          {errors._global && (
            <div className="alert alert-danger">{errors._global}</div>
          )}

          <div className="mb-3">
            <label className="form-label">Display name</label>
            <input
              type="text"
              className={`form-control ${errors.displayName ? "is-invalid" : ""}`}
              value={form.displayName}
              onChange={(e) =>
                setForm((f) => ({ ...f, displayName: e.target.value }))
              }
              placeholder="e.g., Ana, João, Taylor"
              maxLength={40}
            />
            {errors.displayName && (
              <div className="invalid-feedback">{errors.displayName}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Bio</label>
            <textarea
              className={`form-control ${errors.bio ? "is-invalid" : ""}`}
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Tell people a bit about you (no emails/links/phones)."
              maxLength={300}
            />
            <div className="form-text">
              English + Português: we’ll mask profanity and block contact info.
            </div>
            {errors.bio && <div className="invalid-feedback">{errors.bio}</div>}
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setIsEditing(false);
                setErrors({});
                // reset to last saved
                setForm({
                  displayName: userDoc?.displayName || "",
                  bio: about || "",
                });
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        // READ-ONLY VIEW
        <>
          {about && <p className="mt-3 mb-4">{about}</p>}

          <h2 className="h6">Photos</h2>
          {photos.length === 0 ? (
            <div className="alert alert-light">No photos uploaded yet.</div>
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
        </>
      )}

      {/* Large preview modal */}
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
