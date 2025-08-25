// src/pages/Online.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

// Heuristic: user is "online" if they have online==true OR lastActive within 5 minutes.
const FIVE_MIN = 5 * 60 * 1000;

export default function Online() {
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState([]);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "users"));
      const now = Date.now();
      const rows = [];
      snap.forEach((d) => {
        const u = d.data();
        const online =
          u.online === true ||
          (typeof u.lastActive === "number" && now - u.lastActive < FIVE_MIN);
        if (online) rows.push({ id: d.id, ...u });
      });
      setPeople(rows);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="container py-4">Loading…</div>;

  return (
    <div className="container py-4">
      <h2 className="mb-3">Online now</h2>
      {people.length === 0 ? (
        <div className="alert alert-secondary">No one appears to be online right now.</div>
      ) : (
        <ul className="list-group">
          {people.map((p) => (
            <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{p.displayName || "Unnamed"}</span>
              <span className="badge bg-success">online</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
