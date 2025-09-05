import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Link, Navigate, useLocation } from "react-router-dom";

/**
 * Lets ADMINs through, otherwise requires >=1 photo on users/{uid}.
 * We accept several field shapes so it works with different uploaders:
 *  - photoURL: string
 *  - photos: string[] OR {url:string}[]
 *  - image / images[] / avatar / picture / profile.photoURL
 */
export default function RequireProfilePhoto({ children }) {
  const [status, setStatus] = useState("loading"); // loading | ok | blocked | noauth
  const [why, setWhy] = useState("");
  const auth = getAuth();
  const user = auth.currentUser;
  const location = useLocation();

  // utility: pick first url-like string
  function pickFirstUrl(d) {
    const asStr = (v) => (typeof v === "string" ? v : typeof v?.url === "string" ? v.url : "");
    const isUrlish = (s) => !!s && (s.startsWith("http") || s.startsWith("gs://") || s.startsWith("/"));
    const candidates = [
      d?.photoURL,
      asStr(d?.avatar),
      asStr(d?.image),
      asStr(d?.picture),
      asStr(d?.profile?.photoURL),
      ...(Array.isArray(d?.photos) ? d.photos.map(asStr) : []),
      ...(Array.isArray(d?.images) ? d.images.map(asStr) : []),
    ].filter(Boolean);
    return candidates.find(isUrlish) || "";
  }

  useEffect(() => {
    if (!user) {
      setStatus("noauth");
      return;
    }

    let unsub = () => {};
    (async () => {
      try {
        // Admin bypass (custom claim or Firestore mirror)
        const token = await user.getIdTokenResult(true);
        const isAdminClaim = !!token?.claims?.admin;

        let isAdminFirestore = false;
        try {
          const us = await getDoc(doc(db, "users", user.uid));
          isAdminFirestore = us.exists() && !!us.data()?.roles?.admin;
        } catch (_) {}

        if (isAdminClaim || isAdminFirestore) {
          setStatus("ok");
          return;
        }

        // Non-admins: listen live to their profile until there is a photo
        const ref = doc(db, "users", user.uid);
        unsub = onSnapshot(
          ref,
          (snap) => {
            const data = snap.exists() ? snap.data() : {};
            const firstUrl = pickFirstUrl(data);
            if (firstUrl) {
              setStatus("ok");
            } else {
              setStatus("blocked");
              setWhy("Add at least one profile photo to continue.");
            }
          },
          (err) => {
            console.error("RequireProfilePhoto snapshot:", err);
            setStatus("blocked");
            setWhy("We couldn't confirm your photos. Try again.");
          }
        );
      } catch (e) {
        console.error("RequireProfilePhoto:", e);
        setStatus("blocked");
        setWhy("We couldn't confirm your photos. Try again.");
      }
    })();

    return () => unsub();
  }, [user]);

  if (status === "loading") {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
        <div className="mt-2">Checking your profile…</div>
      </div>
    );
  }

  if (status === "noauth") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === "blocked") {
    return (
      <div className="container py-5" style={{ maxWidth: 640 }}>
        <h3>Complete your profile</h3>
        <p className="text-muted">{why}</p>
        <Link className="btn btn-warning" to="/settings">Go to Settings</Link>
      </div>
    );
  }

  return children;
}
