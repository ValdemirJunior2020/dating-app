// src/pages/Browse.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit as qlimit,
} from "firebase/firestore";
import { getDownloadURL, ref as sRef } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { sendLike } from "../services/likes";
import { useToast } from "../components/Toaster";
import EduOnly from "../components/EduOnly";
import { calcAge } from "../utils/age";
import { isCollegeVerified } from "../services/eligibility";

const PLACEHOLDER = "/logo.png";

/** Prefer user's uploaded photos array; fall back to photoURL if present */
function primaryPhotoFromDoc(user) {
  const arr = Array.isArray(user?.photos) ? user.photos : [];
  const first = arr.find((u) => typeof u === "string" && u.length > 6);
  if (first) return String(first);
  if (typeof user?.photoURL === "string" && user.photoURL.length > 6) {
    return String(user.photoURL);
  }
  return null;
}
const isHttpUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const isStoragePath = (s) =>
  typeof s === "string" && (s.startsWith("gs://") || (!s.startsWith("http") && s.includes("/")));

function EduBadge({ v }) {
  return (
    <span
      className={`badge ${v ? "bg-success" : "bg-secondary"}`}
      title={v ? "College verified" : "Not college verified"}
      style={{ fontWeight: 700 }}
    >
      {v ? "Edu" : "Non-Edu"}
    </span>
  );
}

function Card({ meUid, meVerified, user }) {
  const toast = useToast();
  const [liking, setLiking] = useState(false);

  const [photoUrl, setPhotoUrl] = useState(primaryPhotoFromDoc(user));

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let candidate = primaryPhotoFromDoc(user);
      if (candidate && isHttpUrl(candidate)) {
        if (!cancelled) setPhotoUrl(candidate);
        return;
      }
      if (candidate && isStoragePath(candidate)) {
        try {
          const url = await getDownloadURL(sRef(storage, candidate));
          if (!cancelled) setPhotoUrl(url);
          return;
        } catch {
          // continue to fallback
        }
      }

      // Fallback: /users/{uid}/public_photos (newest first)
      try {
        const q = query(
          collection(db, "users", user.id, "public_photos"),
          orderBy("createdAt", "desc"),
          qlimit(1)
        );
        const snap = await getDocs(q);
        const doc0 = snap.docs[0];
        const urlField = doc0?.data()?.url;
        if (!urlField) {
          if (!cancelled) setPhotoUrl(null);
          return;
        }
        if (isHttpUrl(urlField)) {
          if (!cancelled) setPhotoUrl(urlField);
        } else if (isStoragePath(urlField)) {
          try {
            const url = await getDownloadURL(sRef(storage, urlField));
            if (!cancelled) setPhotoUrl(url);
          } catch {
            if (!cancelled) setPhotoUrl(null);
          }
        } else {
          if (!cancelled) setPhotoUrl(null);
        }
      } catch {
        if (!cancelled) setPhotoUrl(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]); // ✅ include `user` to satisfy eslint

  const hasPhoto = !!photoUrl;
  const peerVerified = isCollegeVerified(user);
  const name = user.displayName || user.name || "Someone";
  const age = calcAge(user.dob ?? user.age);

  async function onLike() {
    if (!meUid || !user?.id) return;
    try {
      setLiking(true);
      await sendLike(user.id);
      toast?.show
        ? toast.show({ title: "Liked", desc: `You liked ${name}.`, icon: "❤️" })
        : alert("Liked!");
    } catch (e) {
      console.error(e);
      toast?.show
        ? toast.show({ title: "Like failed", desc: String(e?.message || e), icon: "⚠️" })
        : alert("Like failed");
    } finally {
      setLiking(false);
    }
  }

  return (
    <div
      className="card shadow-sm p-3"
      style={{
        borderRadius: 18,
        background: "rgba(0,0,0,.25)",
        border: "1px solid rgba(255,255,255,.15)",
        textAlign: "center",
        color: "#fff",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 10, left: 10 }}>
        <EduBadge v={peerVerified} />
      </div>

      <div
        style={{
          width: 170,
          height: 170,
          borderRadius: "50%",
          overflow: "hidden",
          margin: "0 auto 12px",
          border: "4px solid rgba(255,255,255,.7)",
          background: "#1b1b1b",
          boxShadow: "0 10px 28px rgba(0,0,0,.35)",
          cursor: hasPhoto ? "zoom-in" : "default",
        }}
      >
        <img
          src={hasPhoto ? photoUrl : PLACEHOLDER}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      <div className="fw-bold mb-2" style={{ fontSize: 18 }}>
        {age ? `${name}, ${age}` : name}
      </div>

      <EduOnly canAct={meVerified} peerVerified={peerVerified} compact>
        <div className="d-flex justify-content-center gap-2">
          <button
            className="btn btn-sm btn-danger fw-bold"
            onClick={onLike}
            disabled={liking}
            aria-label="Like"
          >
            {liking ? "…" : "❤️ Like"}
          </button>

          <Link
            to={`/chat/with/${user.id}`}
            className="btn btn-sm btn-warning fw-bold"
            aria-label="Say hi"
          >
            Say hi
          </Link>

          <Link
            to={`/u/${user.id}`}
            className="btn btn-sm btn-outline-light fw-bold"
            aria-label="View profile"
          >
            View profile
          </Link>
        </div>
      </EduOnly>
    </div>
  );
}

export default function Browse() {
  const auth = useAuth() || {};
  const meUid = auth.currentUser?.uid || auth.user?.uid || null;

  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // load my profile to know if I am college-verified
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!meUid) {
        if (!cancelled) setMe(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", meUid));
        if (!cancelled) setMe(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meUid]);

  // load all users to browse
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "users"));
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        let filtered = list;
        if (meUid) {
          const withoutMe = list.filter((u) => u.id !== meUid);
          filtered = withoutMe.length > 0 ? withoutMe : list;
        }
        if (!cancelled) setUsers(filtered);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meUid]);

  const empty = useMemo(() => !loading && users.length === 0, [loading, users]);
  const meVerified = isCollegeVerified(me);

  return (
    <div className="container" style={{ padding: 16 }}>
      <h3 className="text-white fw-bold mb-3">Browse</h3>

      {loading && <div className="text-white-50">Loading…</div>}
      {empty && <div className="text-white-50">No profiles to show yet.</div>}

      <div className="row g-4">
        {users.map((u) => (
          <div className="col-12 col-sm-6 col-lg-3" key={u.id}>
            <Card meUid={meUid} meVerified={meVerified} user={u} />
          </div>
        ))}
      </div>
    </div>
  );
}
