// src/pages/Browse.jsx
import React, { useEffect, useState } from "react";
import { fetchVisibleUsers } from "../services/users";
import { likeUser } from "../services/match";
import UserCard from "../components/UserCard";

export default function Browse() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchVisibleUsers();
        // normalize for our UI flags
        setUsers(list.map(u => ({ ...u, matched: false, matchId: null })));
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    })();
  }, []);

  async function handleLike(targetId) {
    try {
      const res = await likeUser(targetId); // returns {status, matchId}
      setUsers(prev =>
        prev.map(u =>
          u.uid === targetId ? { ...u, matched: true, matchId: res.matchId } : u
        )
      );
      // Optional toast/alert:
      // if (res.status === "matched") alert("It’s a match! 🎉 You can now chat.");
      // else alert("Chat opened. You can message now.");
    } catch (err) {
      console.error("Like failed:", err);
      alert("Error liking user");
    }
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Browse Profiles</h2>
      <div className="row g-3">
        {users.length === 0 && <p className="text-light">No more users to browse.</p>}
        {users.map(u => (
          <div key={u.uid} className="col-md-4">
            <UserCard user={u} onLike={handleLike} />
          </div>
        ))}
      </div>
    </div>
  );
}
