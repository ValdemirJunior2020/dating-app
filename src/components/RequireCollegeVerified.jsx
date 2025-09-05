import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Link, Navigate, useLocation } from "react-router-dom";

/**
 * Allows access if ANY of these are true:
 *  - user is ADMIN (custom claim admin === true OR users/{uid}.roles.admin === true)
 *  - custom claim eduVerified === true
 *  - users/{uid}.verification.college === true
 *  - verifiedEduEmails/{email} exists
 */
export default function RequireCollegeVerified({ children }) {
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
        // Refresh token to get latest custom claims
        const token = await user.getIdTokenResult(true);

        // 1) Admin bypass
        const isAdminClaim = !!token?.claims?.admin;
        let isAdminFirestore = false;
        try {
          const us = await getDoc(doc(db, "users", user.uid));
          isAdminFirestore = us.exists() && !!us.data()?.roles?.admin;
        } catch (_) {}
        if (isAdminClaim || isAdminFirestore) {
          if (active) setStatus("ok");
          return;
        }

        // 2) College-verified checks
        if (token?.claims?.eduVerified) {
          if (active) setStatus("ok");
          return;
        }

        let isCollegeProfile = false;
        try {
          const uSnap = await getDoc(doc(db, "users", user.uid));
          isCollegeProfile = uSnap.exists() && !!uSnap.data()?.verification?.college;
        } catch (_) {}
        if (isCollegeProfile) {
          if (active) setStatus("ok");
          return;
        }

        if (user.email) {
          const vSnap = await getDoc(doc(db, "verifiedEduEmails", user.email.toLowerCase()));
          if (vSnap.exists()) {
            if (active) setStatus("ok");
            return;
          }
        }

        if (active) {
          setStatus("blocked");
          setReason("To continue, verify a .edu email.");
        }
      } catch (e) {
        console.error("RequireCollegeVerified:", e);
        if (active) {
          setStatus("blocked");
          setReason("We couldn't confirm your .edu verification.");
        }
      }
    })();
    return () => { active = false; };
  }, [user]);

  if (status === "loading") {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
        <div className="mt-2">Checking access…</div>
      </div>
    );
  }

  if (status === "noauth") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === "blocked") {
    return (
      <div className="container py-5" style={{ maxWidth: 600 }}>
        <h3>College verification required</h3>
        <p className="text-muted">{reason}</p>
        <div className="d-flex gap-2">
          <Link className="btn btn-warning" to="/edu-signup">Verify .edu email</Link>
          <Link className="btn btn-outline-secondary" to="/">Back home</Link>
        </div>
      </div>
    );
  }

  return children;
}
