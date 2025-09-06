// src/pages/PublicProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import ZoomableAvatar from "../components/ZoomableAvatar";
import Lightbox from "../components/Lightbox";

export default function PublicProfile() {
  const { uid } = useParams();
  const me = getAuth().currentUser;
  const [u, setU] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStart, setViewerStart] = useState(0);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (on) setU(snap.exists() ? { id: uid, ...snap.data() } : null);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [uid]);

  const photos = useMemo(() => {
    if (!u) return [];
    const arr = Array.isArray(u.photos) ? u.photos : [];
    const urls = arr.map((p) => (typeof p === "string" ? p : p?.url)).filter(Boolean);
    if (!urls.length && u.photoURL) urls.push(u.photoURL);
    return urls;
  }, [u]);

  if (loading) return <div className="container py-5">Loading…</div>;
  if (!u) {
    return (
      <div className="container py-5">
        <h3>Profile not found</h3>
        <Link to="/browse" className="btn btn-primary mt-2">Back to Browse</Link>
      </div>
    );
  }

  const name = u.displayName || u.name || "Someone";
  const primary = photos[0] || "/default-avatar.png";
  const isCollegeVerified = !!u?.verification?.college;

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <ZoomableAvatar
          src={primary}
          alt={name}
          size={120}
          shape="circle"
          verified={isCollegeVerified}
          badgeSize={28}
          badgePosition="br"
        />
        <div className="me-auto">
          <h3 className="mb-0">{name}</h3>
          {u.school && <div className="text-muted">{u.school}</div>}
        </div>
        {me?.uid !== uid && (
          <Link className="btn btn-primary" to={`/chat/with/${uid}`}>
            Say hi
          </Link>
        )}
      </div>

      {/* About */}
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <Field label="Major" value={u.major} />
          <Field label="Class year" value={u.classYear} />
          <Field label="City" value={u.city} />
        </div>
        <div className="col-12 col-md-6">
          <Field label="Pronouns" value={u.pronouns} />
          <Field label="Email" value={u.email} masked />
        </div>
        <div className="col-12">
          <Field label="Bio" value={u.bio} long />
        </div>
      </div>

      {/* More photos */}
      {photos.length > 1 && (
        <>
          <h5 className="mt-4">More photos</h5>
          <div className="d-flex flex-wrap gap-3 mt-2">
            {photos.slice(1).map((url, i) => (
              <button
                key={url}
                type="button"
                aria-label={`Open ${name} photo ${i + 2}`}
                onClick={() => { setViewerStart(i + 1); setViewerOpen(true); }}
                title="Click to enlarge"
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  overflow: "hidden",
                  padding: 0,
                  border: "none",
                  cursor: "zoom-in",
                  background: "transparent",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                }}
              >
                <img
                  src={url}
                  alt=""               // decorative; SRs use the button label
                  aria-hidden="true"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {viewerOpen && (
        <Lightbox
          photos={photos}
          start={viewerStart}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}

function Field({ label, value, long = false, masked = false }) {
  const display =
    value == null || value === ""
      ? <span className="text-muted">—</span>
      : masked
      ? "•••"
      : String(value);
  return (
    <div className="mb-3">
      <div className="form-label mb-1">{label}</div>
      <div className={`form-control ${long ? "" : "bg-light"}`} style={{ minHeight: long ? 80 : 40 }}>
        {display}
      </div>
    </div>
  );
}
