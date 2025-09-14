// src/components/RequireCollegeVerified.jsx
import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
// If your useIsAdmin() reads /roles/{uid}, make sure rules allow it; otherwise just return false in that hook.
import useIsAdmin from "../hooks/useIsAdmin";

function isEduFromUserDoc(d = {}) {
  return Boolean(
    (d.verification && d.verification.college) ||
      d.eduVerified ||
      d.isCollege ||
      d.collegeVerified ||
      d.type === "edu" ||
      (Array.isArray(d.badges) && d.badges.includes("edu"))
  );
}

export default function RequireCollegeVerified({ children }) {
  const { user } = useAuth() || {};
  const isAdmin = useIsAdmin();
  const [ok, setOk] = useState(null); // null=loading, true=allowed, false=blocked

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Admins bypass
      if (isAdmin) {
        if (!cancelled) setOk(true);
        return;
      }

      // Not signed in: block (route should also be behind RequireAuth)
      if (!user?.uid) {
        if (!cancelled) setOk(false);
        return;
      }

      try {
        // Only read my own user doc (rules allow this for signed-in users)
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        const pass = isEduFromUserDoc(data);

        if (!cancelled) setOk(Boolean(pass));
      } catch (_e) {
        // Don’t log to avoid console noise; just block
        if (!cancelled) setOk(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, isAdmin]);

  if (ok === null) {
    return <div className="container py-5">Checking access…</div>;
  }

  if (!ok) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          College verification is required to access this page.
          <div className="mt-3">
            <a href="/edu-signup" className="btn btn-primary btn-sm">
              Verify .edu email
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
