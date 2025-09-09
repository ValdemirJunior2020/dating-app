// src/pages/Rewards.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { BADGES, getGamification } from "../services/gamification";
import BadgeCard from "../components/BadgeCard";

export default function Rewards() {
  const { currentUser } = useAuth() || {};
  const [gam, setGam] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!currentUser?.uid) { setLoading(false); return; }
      const data = await getGamification(currentUser.uid);
      if (alive) { setGam(data || {}); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [currentUser?.uid]);

  const badges = gam?.badges || {};
  const streakCurrent = gam?.streakCurrent || 0;
  const streakLongest = gam?.streakLongest || 0;

  return (
    <div className="container rewards-page" style={{ padding: 16, display: "grid", gap: 16 }}>
      <style>{`
        .rewards-page, .rewards-page * { color: #fff !important; font-weight: 700 !important; }
      `}</style>

      <h2 style={{ margin: 0 }}>Your Progress</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div className="card" style={{
          padding: 16, borderRadius: 12,
          background: "rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.35)"
        }}>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Current Streak</div>
          <div style={{ fontSize: 32 }}>{streakCurrent} day{streakCurrent === 1 ? "" : "s"}</div>
        </div>

        <div className="card" style={{
          padding: 16, borderRadius: 12,
          background: "rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.35)"
        }}>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Longest Streak</div>
          <div style={{ fontSize: 32 }}>{streakLongest} day{streakLongest === 1 ? "" : "s"}</div>
        </div>
      </div>

      <h3 style={{ margin: "8px 0 0 0" }}>Badges</h3>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {BADGES.map(b => (
            <BadgeCard key={b.id} icon={b.icon} label={b.label} desc={b.desc} earned={!!badges[b.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
