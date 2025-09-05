import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Link, Navigate, useLocation } from "react-router-dom";

/**
 * Allows access if ANY is true:
 *  - custom claim admin === true
 *  - users/{uid}.roles.admin === true
 */
export default function RequireAdmin({ children }) {
  const [status, setStatus] = useState("loading"); // loading | ok | blocked | noauth
  const [reason, setReason] = useState("");
  const auth = getAuth();
  const user = auth.currentUser;
  const location = useLocation();

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        setStatus("noauth");
        return;
      }
      try {
        // 1) custom claim
        const token = await user.getIdTokenResult(true);
        if (token?.claims?.admin) {
          if (active) setStatus("ok");
          return;
        }
        // 2) Firestore mirror
        const uSnap = await getDoc(doc(db, "users", user.uid));
        if (uSnap.exists() && uSnap.data()?.roles?.admin) {
          if (active) setStatus("ok");
          return;
        }
        if (active) {
          setStatus("blocked");
          setReason("Admin access required.");
        }
      } catch (e) {
        console.error("RequireAdmin:", e);
        if (active) {
          setStatus("blocked");
          setReason("We couldn't confirm your admin access.");
        }
      }
    })();
    return () => { active = false; };
  }, [user]);

  if (status === "loading") {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
        <div className="mt-2">Checking admin access…</div>
      </div>
    );
  }

  if (status === "noauth") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === "blocked") {
    return (
      <div className="container py-5" style={{ maxWidth: 600 }}>
        <h3>Admins only</h3>
        <p className="text-muted">{reason}</p>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to="/">Back home</Link>
        </div>
      </div>
    );
  }

  return children;
}
