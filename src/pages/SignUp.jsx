// src/pages/SignUp.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import BrandName from "../components/BrandName";
import { calcAge } from "../utils/age";

const COUNTRIES = [
  { code: "+1",  label: "US/CA +1" },
  { code: "+44", label: "UK +44" },
  { code: "+61", label: "AU +61" },
  { code: "+55", label: "BR +55" },
  { code: "+34", label: "ES +34" },
  { code: "+351", label: "PT +351" },
];

export default function SignUp() {
  const nav = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [cc, setCc]             = useState("+1");
  const [phone, setPhone]       = useState("");
  const [dob, setDob]           = useState(""); // YYYY-MM-DD from <input type="date">
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState("");

  function buildE164(ccode, local) {
    const digits = String(local || "").replace(/[^\d]/g, "");
    return `${ccode}${digits}`;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!displayName.trim()) return setErr("Please enter your name.");
    if (!email.trim())       return setErr("Please enter your email.");
    if (!password)           return setErr("Please enter a password.");
    if (!phone.trim())       return setErr("Phone is required.");
    if (!dob)                return setErr("Please select your date of birth.");

    const age = calcAge(dob);
    if (age == null) return setErr("Invalid date of birth.");
    if (age < 18)     return setErr("You must be 18 or older to join.");

    const e164 = buildE164(cc, phone);
    if (e164.length < 7) return setErr("Phone number looks too short.");

    try {
      setBusy(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: displayName.trim() });

      const uid = cred.user.uid;
      await setDoc(
        doc(db, "users", uid),
        {
          uid,
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          phone: e164,
          dob,                 // keep ISO string
          age,                 // denormalize for convenience
          interests: [],       // will be filled right away
          notificationPrefs: { smsLikes: true, smsMatches: true },
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Send new users to interests picker right away (so profiles are complete)
      nav("/profile/interests", { replace: true });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Sign up failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="container bg-transparent">
        <div className="card shadow-sm p-4 auth-card mx-auto" style={{ maxWidth: 520 }}>
          <h1 className="mb-3 text-center fw-semibold" style={{ letterSpacing: ".2px" }}>
            Join <BrandName />
          </h1>

          <form onSubmit={onSubmit} className="d-grid gap-3">
            <div>
              <label className="form-label">Name</label>
              <input className="form-control" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div>
              <label className="form-label">Date of birth</label>
              <input
                type="date"
                className="form-control"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().slice(0, 10)} /* no future DOBs */
              />
              <div className="form-text text-white-50">Must be 18+.</div>
            </div>

            <div>
              <label className="form-label">Phone (required)</label>
              <div className="d-flex" style={{ gap: 8 }}>
                <select className="form-select" style={{ maxWidth: 140 }} value={cc} onChange={(e) => setCc(e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="(555) 555-1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="form-text text-white-50">We’ll format it like E.164 (e.g., +15555551234).</div>
            </div>

            {err && <div className="alert alert-danger m-0">{err}</div>}

            <button className="btn btn-primary btn-lg mt-1" disabled={busy}>
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="text-center mt-3">
            <small className="form-text">
              Already have an account? <Link to="/login">Sign in</Link> ·{" "}
              <Link to="/reset">Forgot password?</Link>
            </small>
          </div>
        </div>
      </div>
    </main>
  );
}
