// src/components/UserCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendLike } from "../services/likes"; // ✅ use sendLike instead of likeUser

export default function UserCard({ user, onEnlarge }) {
  const auth = useAuth();
  const me = auth.currentUser || auth.user || {};
  const uid = me?.uid;

  const photo =
    Array.isArray(user?.photos) && user.photos.length > 0
      ? user.photos[0]
      : user?.photoURL || null;

  async function handleLike() {
    try {
      await sendLike(uid, user.id); // ✅ correct function
      alert(`You liked ${user.displayName || "this user"}!`);
    } catch (err) {
      console.error(err);
      alert("Failed to like.");
    }
  }

  return (
    <div
      className="card shadow-sm p-3"
      style={{
        width: 250,
        borderRadius: 18,
        background: "rgba(0,0,0,.25)",
        border: "1px solid rgba(255,255,255,.15)",
        textAlign: "center",
        color: "#fff",
      }}
    >
      {/* photo */}
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          overflow: "hidden",
          margin: "0 auto 12px",
          border: "3px solid rgba(255,255,255,.6)",
          background: "#1b1b1b",
          cursor: photo ? "zoom-in" : "default",
        }}
        onClick={() => photo && onEnlarge(photo)}
      >
        {photo ? (
          <img
            src={photo}
            alt={user.displayName || "profile"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div className="text-white-50 d-flex align-items-center justify-content-center h-100">
            No photo
          </div>
        )}
      </div>

      {/* name + age */}
      <h5 className="mb-1">{user.displayName || user.name || "Someone"}</h5>
      {user.age && <div className="text-white-50 fw-bold">{user.age}</div>}

      {/* interests preview */}
      <div className="mt-2">
        {(user.interests && user.interests.length > 0) ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              justifyContent: "center",
            }}
          >
            {user.interests.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="badge rounded-pill"
                style={{
                  background: "#dff3ff",
                  color: "#153e52",
                  fontWeight: 700,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-white-50">No interests yet</div>
        )}
      </div>

      {/* actions */}
      <div className="d-flex justify-content-center gap-2 mt-3">
        <button className="btn btn-sm btn-outline-light" onClick={handleLike}>
          ❤️ Like
        </button>
        <Link to={`/chat/with/${user.id}`} className="btn btn-sm btn-primary">
          💬 Chat
        </Link>
        <Link to={`/u/${user.id}`} className="btn btn-sm btn-secondary">
          👤 Profile
        </Link>
      </div>
    </div>
  );
}
