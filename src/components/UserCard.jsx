// src/components/UserCard.jsx
import React from "react";

export default function UserCard({ user, onLike, onSkip }) {
  return (
    <div className="card shadow-sm">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.name}
          className="card-img-top"
          style={{ objectFit: "cover", height: "250px" }}
        />
      ) : (
        <div className="bg-secondary text-white d-flex align-items-center justify-content-center"
             style={{ height: "250px" }}>
          No Photo
        </div>
      )}

      <div className="card-body">
        <h5>{user.name}</h5>
        <p className="text-muted">{user.age} • {user.bio}</p>
        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm" onClick={() => onLike(user.uid)}>❤️ Like</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onSkip(user.uid)}>Skip</button>
        </div>
      </div>
    </div>
  );
}
