// src/pages/Report.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { submitReport } from "../services/reports";
import { useToast } from "../components/Toaster";

const REASONS = [
  "Harassment or bullying",
  "Hate speech or discrimination",
  "Inappropriate content",
  "Spam or scam",
  "Fake/impersonation",
  "Underage / safety concern",
  "Other"
];

export default function Report() {
  const { uid: reportedUid } = useParams();
  const { currentUser } = useAuth() || {};
  const toast = useToast();
  const navigate = useNavigate();

  const [reason, setReason] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit = !!reason && !!reportedUid && !!currentUser?.uid;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await submitReport({
        reporterUid: currentUser.uid,
        reportedUid,
        reason,
        details: details.trim(),
        context: { page: window.location.pathname }
      });
      toast.show({
        title: "Report submitted",
        desc: "Thanks for helping keep the community safe.",
        icon: "🛡️",
        duration: 3200
      });
      navigate(-1); // go back to previous page
    } catch (err) {
      toast.show({
        title: "Could not submit report",
        desc: String(err?.message || err),
        icon: "⚠️",
        duration: 4000
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container report-page" style={{ padding: 16, maxWidth: 720 }}>
      {/* page-local styles for readability on your dark BG */}
      <style>{`
        .report-page, .report-page * { color: #fff !important; font-weight: 700 !important; }
        .report-page .panel { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.35); border-radius: 12px; padding: 16px; }
        .report-page select, .report-page textarea {
          width: 100%; padding: 10px 12px; border-radius: 10px;
          background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.45); color: #fff;
        }
        .report-page textarea { min-height: 120px; resize: vertical; }
      `}</style>

      <h2 style={{ marginTop: 0 }}>Report user</h2>
      <p style={{ marginTop: 0, opacity: 0.95 }}>Help us review this account. Your report is confidential.</p>

      <form className="panel" onSubmit={onSubmit}>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label>Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Select a reason…</option>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label>Details (optional)</label>
            <textarea
              placeholder="Add any context (what happened, where, when)…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="btn btn-sm btn-outline-light border"
              style={{ padding: "10px 14px", borderRadius: 10 }}
            >
              {submitting ? "Submitting…" : "Submit report"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-sm btn-outline-light border"
              style={{ padding: "10px 14px", borderRadius: 10 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.85 }}>
        Reporting user ID: <code style={{ fontWeight: 800 }}>{reportedUid}</code>
      </div>
    </div>
  );
}
