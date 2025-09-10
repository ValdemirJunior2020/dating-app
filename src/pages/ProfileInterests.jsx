// src/pages/ProfileInterests.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserInterests, setUserInterests } from "../services/interests";
import InterestsSelector from "../components/InterestsSelector";
import { useToast } from "../components/Toaster";

export default function ProfileInterests() {
  const auth = useAuth() || {};
  const uid = auth.currentUser?.uid || auth.user?.uid || null;

  const toast = useToast();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const arr = await getUserInterests(uid); // ← uses your interests.js
        if (alive) setSelected(arr);
      } catch (e) {
        console.error(e);
        if (alive) setErr("Failed to load interests.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [uid]);

  async function onSave() {
    try {
      setSaving(true);
      const arr = await setUserInterests(uid, selected); // ← uses your interests.js
      toast.show({ title: "Saved", desc: `Saved ${arr.length} interests.`, icon: "✅" });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to save.");
      toast.show({ title: "Save failed", desc: String(e?.message || e), icon: "⚠️" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container" style={{ padding: 16, maxWidth: 800 }}>
      <style>{`.container * { color:#fff !important; font-weight:700 }`}</style>
      <h3 className="mb-3">Your interests</h3>

      {loading ? (
        <div className="text-white-50">Loading…</div>
      ) : (
        <>
          <InterestsSelector value={selected} onChange={setSelected} />
          {err && <div className="alert alert-danger mt-3">{err}</div>}
          <div className="mt-3 d-flex gap-2">
            <button className="btn btn-primary" onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save interests"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
