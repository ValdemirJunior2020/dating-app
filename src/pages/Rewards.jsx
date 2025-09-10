// src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { Link } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");

    if (!email.trim()) {
      setErr("Email is required.");
      return;
    }

    try {
      setBusy(true);
      await sendPasswordResetEmail(auth, email.trim(), {
        url: "https://yourapp.web.app/login", // where user will return after reset
      });
      setMsg("Password reset email sent. Check your inbox!");
    } catch (e2) {
      console.error(e2);
      setErr(e2?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container text-center" style={{ maxWidth: 480, marginTop: 50 }}>
      <h2 className="mb-4 text-white">Reset Password</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          className="form-control"
          placeholder="Enter your account email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send reset email"}
        </button>
      </form>

      {msg && <div className="alert alert-success mt-3">{msg}</div>}
      {err && <div className="alert alert-danger mt-3">{err}</div>}

      <div className="mt-3">
        <Link to="/login" className="btn btn-outline-light">Back to Login</Link>
      </div>
    </div>
  );
}
