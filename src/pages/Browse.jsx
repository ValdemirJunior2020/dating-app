// src/pages/Browse.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchVisibleUsers } from "../services/users";
import { sendLike } from "../services/likes";
import { useToast } from "../components/Toaster";
import useUnreadByPeer from "../hooks/useUnreadByPeer";
import UnreadDot from "../components/UnreadDot";

const PLACEHOLDER = "/logo.png";

function primaryPhoto(user) {
  const photos = Array.isArray(user?.photos) ? user.photos : [];
  const first = photos.find((u) => typeof u === "string" && u.length > 6);
  return first || (typeof user?.photoURL === "string" ? user.photoURL : null);
}

function Card({ meUid, user, hasUnread }) {
  const nav = useNavigate();
  const toast = useToast();
  const [liking, setLiking] = useState(false);

  const url = primaryPhoto(user);
  const hasPhoto = !!url;

  async function onLike() {
    if (!meUid || !user?.id) return;
    try {
      setLiking(true);
      await sendLike(meUid, user.id);
      toast?.show
        ? toast.show({ title: "Liked", desc: `You liked ${user.displayName || "this user"}.`, icon: "❤️" })
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
    img.setAttribute("data-enlarge", url); // your ImageLightbox listens for this
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
      }}
    >
      {/* circular photo with unread dot */}
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
          position: "relative",
        }}
        onClick={enlarge}
      >
        <img
          src={hasPhoto ? url : PLACEHOLDER}
          alt={user.displayName || user.name || "profile"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          data-enlarge={hasPhoto ? url : undefined}
        />
        <UnreadDot show={!!hasUnread} />
      </div>

      {/* name */}
      <div className="fw-bold mb-2" style={{ fontSize: 18 }}>
        {user.displayName || user.name || "Someone"}
      </div>

      {/* actions: ❤️ Like  |  Say hi  |  View profile */}
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
    </div>
  );
}

export default function Browse() {
  const auth = useAuth() || {};
  const meUid = auth.currentUser?.uid || auth.user?.uid || null;
  const unreadByPeer = useUnreadByPeer(meUid); // ← Set<otherUid>

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await fetchVisibleUsers();
        const filtered = meUid ? list.filter((u) => u.id !== meUid) : list;
        if (alive) setUsers(filtered);
      } catch (e) {
        console.error(e);
        if (alive) setUsers([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [meUid]);

  const empty = useMemo(() => !loading && users.length === 0, [loading, users]);

  return (
    <div className="container" style={{ padding: 16 }}>
      <h3 className="text-white fw-bold mb-3">Browse</h3>

      {loading && <div className="text-white-50">Loading…</div>}
      {empty && <div className="text-white-50">No profiles to show yet.</div>}

      <div className="row g-4">
        {users.map((u) => (
          <div className="col-12 col-sm-6 col-lg-3" key={u.id}>
            <Card meUid={meUid} user={u} hasUnread={unreadByPeer.has(u.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
