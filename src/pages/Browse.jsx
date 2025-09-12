// src/pages/Browse.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { sendLike } from "../services/likes";
import { useToast } from "../components/Toaster";
import EduOnly from "../components/EduOnly";
import { calcAge } from "../utils/age";
import { isCollegeVerified } from "../services/eligibility";

const PLACEHOLDER = "/logo.png";

function primaryPhoto(user) {
  const arr = Array.isArray(user?.photos) ? user.photos : [];
  const first = arr.find((u) => typeof u === "string" && u.length > 6);
  return first || (typeof user?.photoURL === "string" ? user.photoURL : null);
}

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
  const nav = useNavigate();
  const toast = useToast();
  const [liking, setLiking] = useState(false);

  const url = primaryPhoto(user);
  const hasPhoto = !!url;
  const peerVerified = isCollegeVerified(user);
  const name = user.displayName || user.name || "Someone";
  const age = calcAge(user.dob ?? user.age);

  async function onLike() {
    if (!meUid || !user?.id) return;
    try {
      setLiking(true);
      await sendLike(meUid, user.id); // server will also double-check
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

  function onSayHi() {
    nav(`/chat/with/${user.id}`);
  }

  function enlarge() {
    if (!hasPhoto) return;
    const img = document.createElement("img");
    img.setAttribute("data-enlarge", url);
    document.body.appendChild(img);
    img.click();
    img.remove();
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
      {/* corner badge */}
      <div style={{ position: "absolute", top: 10, left: 10 }}>
        <EduBadge v={peerVerified} />
      </div>

      {/* circular photo */}
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
        onClick={enlarge}
      >
        <img
          src={hasPhoto ? url : PLACEHOLDER}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          data-enlarge={hasPhoto ? url : undefined}
        />
      </div>

      {/* name + age */}
      <div className="fw-bold mb-2" style={{ fontSize: 18 }}>
        {age ? `${name}, ${age}` : name}
      </div>

      {/* actions (gated) */}
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

          <button
            className="btn btn-sm btn-warning fw-bold"
            onClick={onSayHi}
            aria-label="Say hi"
          >
            Say hi
          </button>

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
    let alive = true;
    (async () => {
      if (!meUid) {
        if (alive) setMe(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", meUid));
        if (alive) setMe(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (e) {
        console.error(e);
        if (alive) setMe(null);
      }
    })();
    return () => { alive = false; };
  }, [meUid]);

  // load all users to browse
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "users"));
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        // hide me only if there are others
        let filtered = list;
        if (meUid) {
          const withoutMe = list.filter((u) => u.id !== meUid);
          filtered = withoutMe.length > 0 ? withoutMe : list;
        }
        if (alive) setUsers(filtered);
      } catch (e) {
        console.error(e);
        if (alive) setUsers([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [meUid]);

  const empty = useMemo(() => !loading && users.length === 0, [loading, users]);
  const meVerified = isCollegeVerified(me);

  return (
    <div className="container" style={{ padding: 16 }}>
      <h3 className="text-white fw-bold mb-3">Browse</h3>

      {!meVerified && (
        <div className="alert alert-warning py-2">
          You can browse everyone, but <strong>only college-verified members</strong> can like or chat.{" "}
          <Link className="alert-link" to="/edu-signup">Verify your .edu</Link>.
        </div>
      )}

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
