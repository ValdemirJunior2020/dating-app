// src/pages/Discover.jsx
import { useEffect, useState } from "react";
import InterestsSelector from "../components/InterestsSelector";
import { findUsersByInterests } from "../services/discover";
import UserCard from "../components/UserCard";
import { useAuth } from "../context/AuthContext";
import "./Discover.css";

export default function Discover() {
  const { currentUser } = useAuth() || {};
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const search = async () => {
    setLoading(true);
    try {
      const found = await findUsersByInterests(selected, {
        excludeUid: currentUser?.uid,
        max: 50,
      });
      setResults(found);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected.length) search();
    else setResults([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <div className="container discover-page" style={{ padding: 16, display: "grid", gap: 16 }}>
      <h2 className="discover-title">Discover by Interests</h2>
      <p className="discover-sub">Pick a few interests to find people who vibe with you.</p>

      {/* Dark variant so input text, chips, etc. are readable on dark bg */}
      <InterestsSelector value={selected} onChange={setSelected} max={12} variant="dark" />

      {!selected.length && (
        <div className="discover-hint">
          Select at least 1 interest to see matches.
        </div>
      )}

      {loading && <div className="discover-loading">Loading…</div>}

      {!loading && results.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {results.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {!loading && selected.length > 0 && results.length === 0 && (
        <div className="discover-empty">No users found for those interests (try adding or changing tags).</div>
      )}
    </div>
  );
}
