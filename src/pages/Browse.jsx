// src/pages/Browse.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import ZoomableAvatar from "../components/ZoomableAvatar";
import Lightbox from "../components/Lightbox";
import cleanPhotos from "../utils/cleanPhotos";

export default function Browse() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // 🔁 No 'visible == true' for now so existing users show up again
        const q = query(
          collection(db, "users"),
          orderBy("updatedAt", "desc"),
          limit(48)
        );
        const snap = await getDocs(q);
        if (!active) return;
        setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Browse load:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const cards = useMemo(() => {
    return rows.map((u) => {
      const photos = cleanPhotos(u.photos || []);
      const urls = photos
        .map((p) => (typeof p === "string" ? p : p?.url))
        .filter(Boolean);
      const primary = urls[0] || "/logo.png"; // fallback; put any image at public/logo.png
      const name = u.displayName || u.name || "Someone";

      // broad check for your edu flag
      const verified =
        !!(u?.verification?.college ||
           u?.eduVerified ||
           u?.isCollege ||
           u?.collegeVerified ||
           u?.type === "edu" ||
           (Array.isArray(u?.badges) && u.badges.includes("edu")));

      return { id: u.uid || u.id, name, primary, urls, verified };
    });
  }, [rows]);

  const openViewer = (images) => {
    setViewerImages(images.length ? images : ["/logo.png"]);
    setViewerOpen(true);
  };

  if (loading) return <div className="container py-5">Loading…</div>;

  return (
    <div className="container py-4">
      <h2 className="mb-3">Browse</h2>

      <div className="row g-4">
        {cards.map((u) => (
          <div key={u.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
            <div className="card shadow-sm h-100">
              <div className="card-body d-flex flex-column align-items-center">
                <ZoomableAvatar
                  src={u.primary}
                  size={160}
                  verified={u.verified}
                  onClick={() => openViewer(u.urls)}
                />
                <div className="text-center mt-3 w-100">
                  <div className="fw-semibold">{u.name}</div>
                  <div className="d-flex justify-content-center gap-2 mt-2">
                    <Link className="btn btn-warning btn-sm" to={`/chat/with/${u.id}`}>Say hi</Link>
                    <Link className="btn btn-outline-secondary btn-sm" to={`/u/${u.id}`}>View profile</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Lightbox
        open={viewerOpen}
        images={viewerImages}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
