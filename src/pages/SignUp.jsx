// src/pages/SignUp.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase";
import { setUserPhoneAndPrefs } from "../services/users";
import { useToast } from "../components/Toaster";
import PhoneField from "../components/PhoneField";

function validPhone(p) {
  return typeof p === "string" && /^\+\d{6,}$/.test(p);
}

export default function SignUp() {
  const nav = useNavigate();
  const toast = useToast();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");

  const [phone, setPhone]         = useState("+1"); // E.164-ish, starts with +1

  const [smsOptIn, setSmsOptIn]           = useState(true);
  const [emailOptIn, setEmailOptIn]       = useState(true);
  const [notifyOnLike, setNotifyOnLike]   = useState(true);
  const [notifyOnMatch, setNotifyOnMatch] = useState(true);

  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!displayName.trim()) return setErr("Name is required.");
    if (!email.trim() || !password.trim()) return setErr("Email and password are required.");
    if (!validPhone(phone)) return setErr("Valid phone (with country code) is required.");

    try {
      setBusy(true);

      // Create account
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }

      // Send Firebase verification email
      await sendEmailVerification(cred.user, { url: window.location.origin + "/login" });

      // Save phone + notification prefs
      await setUserPhoneAndPrefs(cred.user.uid, {
        phone,
        smsOptIn,
        emailOptIn,
        notifyOnLike,
        notifyOnMatch,
      });

      toast.show({
        title: "Check your email",
        desc: "We sent a verification link. Please confirm before logging in.",
        icon: "📧",
      });

      nav("/login");
    } catch (e2) {
      console.error(e2);
      setErr(e2?.message || String(e2));
      toast.show({ title: "Sign up failed", desc: String(e2?.message || e2), icon: "⚠️" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ padding: 16, maxWidth: 560 }}>
      <style>{`.container * { color: #fff !important; font-weight: 700 }`}</style>
      <h2 style={{ marginTop: 0 }}>Create your account</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div>
          <label className="form-label">Name</label>
          <input
            className="form-control"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="form-label">Email</label>
          <input
            className="form-control"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="form-label">Password</label>
          <input
            className="form-control"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="form-label">Phone (required)</label>
          <PhoneField value={phone} onChange={setPhone} defaultCountry="us" />
          <div className="form-text" style={{ color: "rgba(255,255,255,.8)" }}>
            Include country code (e.g., +1 US, +55 BR, +44 UK)
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: 12,
            borderRadius: 12,
            background: "rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.35)",
          }}
        >
          <div className="form-check">
            <input
              id="smsOptIn"
              className="form-check-input"
              type="checkbox"
              checked={smsOptIn}
              onChange={(e) => setSmsOptIn(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="smsOptIn">Text me updates</label>
          </div>
          <div className="form-check">
            <input
              id="emailOptIn"
              className="form-check-input"
              type="checkbox"
              checked={emailOptIn}
              onChange={(e) => setEmailOptIn(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="emailOptIn">Email me updates</label>
          </div>
          <div className="form-check">
            <input
              id="notifyOnLike"
              className="form-check-input"
              type="checkbox"
              checked={notifyOnLike}
              onChange={(e) => setNotifyOnLike(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="notifyOnLike">Notify on Like</label>
          </div>
          <div className="form-check">
            <input
              id="notifyOnMatch"
              className="form-check-input"
              type="checkbox"
              checked={notifyOnMatch}
              onChange={(e) => setNotifyOnMatch(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="notifyOnMatch">Notify on Match</label>
          </div>
        </div>

        {err && <div className="alert alert-danger">{err}</div>}

        <div className="d-flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
          <Link to="/login" className="btn btn-outline-light">Have an account? Sign in</Link>
        </div>
      </form>
    </div>
  );
}
