// src/pages/ProfileInterests.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import InterestsSelector from "../components/InterestsSelector";
import { getUserInterests, setUserInterests } from "../services/interests";
import { recordEvent, BADGES } from "../services/gamification";
import { useToast } from "../components/Toaster";

const INTERESTS_BADGE_ID = "interests_set";

export default function ProfileInterests() {
  const { currentUser } = useAuth() || {};
  const toast = useToast();

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

  const handleSave = async () => {
    if (!currentUser?.uid) return;
    setSaving(true);
    try {
      await setUserInterests(currentUser.uid, interests);
      // always show a small "saved" toast
      toast.show({ title: "Interests saved", icon: "✅", duration: 2200 });

      // record the event, then toast the badge once if it becomes true
      const res = await recordEvent(currentUser.uid, "interests_saved");
      const b = BADGES.find(x => x.id === INTERESTS_BADGE_ID);
      const seenKey = `badge-shown:${currentUser.uid}:${INTERESTS_BADGE_ID}`;
      // res may be null on first call; also OK if badge was already earned
      const earned = (res?.gam?.badges && (res.gam.badges[INTERESTS_BADGE_ID] || false)) || false;
      if (earned && !localStorage.getItem(seenKey)) {
        toast.show({
          title: `Badge unlocked: ${b?.label || "Dialed In"}`,
          desc: b?.desc || "Saved your interests.",
          icon: b?.icon || "🏷️",
          duration: 4200
        });
        localStorage.setItem(seenKey, "1");
      }
    } finally {
      setSaving(false);
    }
  };

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
            <InterestsSelector value={interests} onChange={setInterests} max={12} variant="dark" />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="btn btn-sm btn-outline-light border"
              style={{ padding: "10px 14px", borderRadius: 10 }}
            >
              {saving ? "Saving…" : "Save Interests"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
