// src/pages/ProfileInterests.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import InterestsSelector from "../components/InterestsSelector";
import { getUserInterests, setUserInterests } from "../services/interests";

export default function ProfileInterests() {
  const { currentUser } = useAuth() || {};
  const [interests, setInterests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!currentUser?.uid) { setLoading(false); return; }
      const existing = await getUserInterests(currentUser.uid);
      if (alive) {
        setInterests(existing);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [currentUser?.uid]);

  return (
    <div className="container interests-page" style={{ padding: 16 }}>
      {/* page-local styles: white + bold + placeholder color */}
      <style>{`
        .interests-page, .interests-page * { color: #fff !important; font-weight: 700 !important; }
        .interests-page input::placeholder { color: rgba(255,255,255,0.92); font-weight: 700; }
      `}</style>

      <h2 style={{ marginTop: 0 }}>Interests & Hobbies</h2>
      <p style={{ margin: 0, opacity: 0.95 }}>
        Choose what you’re into. This helps Discover find better matches.
      </p>

      {loading ? (
        <div style={{
          marginTop: 12,
          border: "1px dashed rgba(255,255,255,0.35)",
          background: "rgba(0,0,0,0.25)",
          borderRadius: 12,
          padding: "12px 16px"
        }}>
          Loading…
        </div>
      ) : (
        <>
          <div style={{ marginTop: 12 }}>
            {/* dark variant renders white-on-dark chips/inputs */}
            <InterestsSelector value={interests} onChange={setInterests} max={12} variant="dark" />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                if (!currentUser?.uid) return;
                setSaving(true);
                try {
                  await setUserInterests(currentUser.uid, interests);
                  alert("Interests saved!");
                } finally {
                  setSaving(false);
                }
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.45)",
                background: "rgba(255,255,255,0.08)"
              }}
            >
              {saving ? "Saving…" : "Save Interests"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
