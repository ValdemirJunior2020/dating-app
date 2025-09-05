import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import ZoomableAvatar from "../components/ZoomableAvatar";

export default function Browse() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const myUid = getAuth().currentUser?.uid;
        let list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

        list = list
          .filter((u) => u.id !== myUid && (u.visible !== false))
          .sort((a, b) =>
            String(a.displayName || a.name || "")
              .toLowerCase()
              .localeCompare(String(b.displayName || b.name || "").toLowerCase())
          );

        if (mounted) {
          setUsers(list);
          setLoading(false);
        }
      } catch (e) {
        console.error("Browse load users:", e);
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
        <div className="mt-2">Loading people…</div>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="container py-5 text-center">
        <h3>No profiles yet</h3>
        <p className="text-muted">Check back soon—new people join every day.</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">Browse</h2>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
        {users.map((u) => {
          const name = u.displayName || u.name || "Someone";
          const photo =
            u.photoURL ||
            (u.photos && Array.isArray(u.photos) && (typeof u.photos[0] === "string" ? u.photos[0] : u.photos[0]?.url)) ||
            "/default-avatar.png";
          const isCollegeVerified = !!u?.verification?.college;

          return (
            <div className="col" key={u.id}>
              <div className="card h-100 shadow-sm" style={{ border: "none", borderRadius: 20 }}>
                <div className="pt-3 text-center">
                  <ZoomableAvatar
                    src={photo}
                    alt={name}
                    size={180}
                    shape="circle"     // <-- circle avatar
                    verified={isCollegeVerified}
                    badgeSize={36}
                    badgePosition="br"
                  />
                </div>

                <div className="card-body d-flex flex-column">
                  <h5 className="card-title mb-1">{name}</h5>
                  {u.school && (
                    <div className="text-muted" style={{ fontSize: 14 }}>
                      {u.school}
                    </div>
                  )}
                  {u.bio && (
                    <p className="card-text mt-2" style={{ fontSize: 14 }}>
                      {String(u.bio).length > 120 ? String(u.bio).slice(0, 117) + "…" : u.bio}
                    </p>
                  )}
                  <div className="mt-auto d-flex gap-2">
                    <Link className="btn btn-primary" to={`/chat/with/${u.id}`}>Say hi</Link>
                    <Link className="btn btn-outline-secondary" to={`/profile/${u.id}`}>View profile</Link>
                  </div>
                </div>

                {isCollegeVerified && (
                  <div className="px-3 pb-3" style={{ fontSize: 12, color: "#6b4b1f" }}>
                    <span className="badge" style={{ background: "#fff8e6", border: "1px solid #ffcf7a", color: "#6b4b1f", fontWeight: 600 }}>
                      College verified
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
