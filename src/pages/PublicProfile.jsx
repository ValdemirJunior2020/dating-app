import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import cleanPhotos from "../utils/cleanPhotos";
import VerifiedBadge from "../components/VerifiedBadge";
import "../styles/profile.css";

// helper: pick the first available field from a list
const pick = (obj, candidates) =>
  candidates.map((k) => obj?.[k]).find((v) => v && String(v).trim() !== "") || "";

const Labeled = ({ label, value }) => (
  <div className="col-md-6">
    <div className="pp-label">{label}</div>
    <div className="pp-value">{value || "—"}</div>
  </div>
);

export default function PublicProfile() {
  const { uid } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setUser({ id: snap.id, ...snap.data() });
    })();
  }, [uid]);

  const photos = useMemo(() => cleanPhotos(user?.photos || []), [user?.photos]);
  const avatar = photos[0] || "/logo192.png";

  const openLightbox = (index) => {
    if (window.__openLightbox) window.__openLightbox(photos, index);
    else window.open(photos[index], "_blank", "noopener,noreferrer");
  };

  if (!user) return <div className="container py-5 text-white">Loading…</div>;

  // only safe, display-oriented fields
  const displayName = pick(user, ["displayName", "name"]);
  const pronouns    = pick(user, ["pronouns"]);
  const major       = pick(user, ["major", "study"]);
  const classYear   = pick(user, ["classYear", "gradYear"]);
  const city        = pick(user, ["city", "location"]);
  const school      = pick(user, ["school", "college"]);
  const bio         = pick(user, ["about", "bio"]);
  const interests   = Array.isArray(user?.interests) ? user.interests : [];

  return (
    <div className="container py-4 public-profile">
      {/* Header */}
      <div className="pp-card glass mb-4">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <img src={avatar} alt="" className="pp-avatar" />
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h1 className="pp-name m-0">{displayName || "Unknown"}</h1>
              {user?.verifiedEdu && <VerifiedBadge />}
            </div>
            {(city || school) && (
              <div className="pp-subtle mt-1">
                {[city, school].filter(Boolean).join(" • ")}
              </div>
            )}
          </div>
          <Link to={`/chat/with/${uid}`} className="btn btn-warning ms-auto">
            Say hi
          </Link>
        </div>
      </div>

      {/* Details */}
      <div className="pp-card glass mb-4">
        <div className="row g-4">
          <Labeled label="Pronouns"     value={pronouns} />
          <Labeled label="Major"        value={major} />
          <Labeled label="Class (year)" value={classYear} />
          <Labeled label="City"         value={city} />
          <Labeled label="School"       value={school} />

          <div className="col-12">
            <div className="pp-label">Bio</div>
            <div className="pp-value">{bio || "—"}</div>
          </div>

          {interests.length > 0 && (
            <div className="col-12">
              <div className="pp-label">Interests</div>
              <div className="d-flex flex-wrap gap-2">
                {interests.map((t, i) => (
                  <span key={i} className="badge bg-warning text-dark">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="pp-card glass">
          <div className="pp-label mb-2">Photos</div>
          <div className="pp-grid">
            {photos.map((u, i) => (
              <button
                key={u + i}
                className="pp-photo"
                style={{ backgroundImage: `url(${u})` }}
                onClick={() => openLightbox(i)}
                aria-label={`Open photo ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
