// src/components/RequireCollegeVerified.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import useIsAdmin from "../hooks/useIsAdmin";

export default function RequireCollegeVerified({ children }) {
  const u = auth.currentUser;
  const isAdmin = useIsAdmin();
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!u) return setOk(false);
      if (isAdmin) return setOk(true); // ✅ admin bypass

      try {
        // flags on user doc
        const snap = await getDoc(doc(db, "users", u.uid));
        const d = snap.exists() ? snap.data() : {};
        const docOk =
          !!(d?.verification?.college ||
             d?.eduVerified ||
             d?.isCollege ||
             d?.collegeVerified ||
             d?.type === "edu" ||
             (Array.isArray(d?.badges) && d.badges.includes("edu")));

        if (docOk) return setOk(true);

        // fallback: verifiedEduEmails/{email}
        const email = (u.email || "").toLowerCase();
        if (email) {
          const vs = await getDoc(doc(db, "verifiedEduEmails", email));
          if (vs.exists()) return setOk(true);
        }
        if (!cancelled) setOk(false);
      } catch (e) {
        console.error("RequireCollegeVerified:", e);
        if (!cancelled) setOk(false);
      }
    })();
    return () => { cancelled = true; };
  }, [u, isAdmin]);

  if (ok === null) return <div className="container py-5">Checking access…</div>;
  if (!ok) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          College verification is required to access this page.
          <div className="mt-3">
            <a href="/edu-signup" className="btn btn-primary btn-sm">Verify .edu email</a>
          </div>
        </div>
      </div>
    );
  }
  return children;
}
