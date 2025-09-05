import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Simple Admin landing page.
 * - Shows a quick count of users and how many are college-verified.
 * - You can expand this later (e.g., a users table, moderation tools).
 */
export default function AdminDashboard() {
  const [counts, setCounts] = useState({ total: 0, verified: 0, loading: true });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        let total = 0;
        let verified = 0;
        snap.forEach((d) => {
          total += 1;
          const v = d.data()?.verification?.college;
          if (v) verified += 1;
        });
        if (mounted) setCounts({ total, verified, loading: false });
      } catch (e) {
        console.error("AdminDashboard load:", e);
        if (mounted) setCounts((c) => ({ ...c, loading: false }));
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <h2 className="mb-3">Admin</h2>
      {counts.loading ? (
        <div className="text-muted">Loading stats…</div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted">Total users</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{counts.total}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted">College-verified</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{counts.verified}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <hr className="my-4" />
      <p className="text-muted" style={{ maxWidth: 640 }}>
        You can add admin tools here (view users, moderate photos, export reports, etc.).
      </p>
    </div>
  );
}
