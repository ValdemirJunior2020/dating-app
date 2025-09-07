// src/components/RequireProfilePhoto.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import useIsAdmin from "../hooks/useIsAdmin";

export default function RequireProfilePhoto({ children }) {
  const u = auth.currentUser;
  const isAdmin = useIsAdmin();
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!u) return setOk(false);
      if (isAdmin) return setOk(true); // ✅ admin bypass

      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        const d = snap.exists() ? snap.data() : {};
        const photos = Array.isArray(d?.photos) ? d.photos : [];
        const hasPhoto = photos.some((p) => (typeof p === "string" ? p : p?.url));
        if (!cancelled) setOk(!!hasPhoto);
      } catch (e) {
        console.error("RequireProfilePhoto:", e);
        if (!cancelled) setOk(false);
      }
    })();
    return () => { cancelled = true; };
  }, [u, isAdmin]);

  if (ok === null) return <div className="container py-5">Checking access…</div>;
  if (!ok) {
    return (
      <div className="container py-5">
        <div className="alert alert-info">
          Please add at least one photo to continue.
          <div className="mt-3">
            <a href="/settings" className="btn btn-dark btn-sm">Go to Settings</a>
          </div>
        </div>
      </div>
    );
  }
  return children;
}
