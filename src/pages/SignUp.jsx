// src/pages/SignUp.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { emailSignUp } from "../firebase";

export default function SignUp() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirm: "",
    about: "",
  });
  const [busy, setBusy] = useState(false);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await emailSignUp({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        about: form.about,
      });
      nav("/browse", { replace: true });
    } catch (err) {
      console.error(err);
      alert(err.message || "Sign up failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form
        className="card auth-card p-4 shadow"
        style={{ maxWidth: 520, width: "100%" }}
        onSubmit={onSubmit}
      >
        <h1 className="h4 mb-3 text-center">
          Join <span className="brand-cursive">Candle Love</span>
        </h1>

        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            name="displayName"
            className="form-control"
            value={form.displayName}
            onChange={onChange}
            placeholder="Your name"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={form.password}
            onChange={onChange}
            minLength={6}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Confirm password</label>
          <input
            type="password"
            name="confirm"
            className="form-control"
            value={form.confirm}
            onChange={onChange}
            minLength={6}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">About you (optional)</label>
          <textarea
            name="about"
            rows={3}
            className="form-control"
            value={form.about}
            onChange={onChange}
            placeholder="A sentence that describes you"
          />
        </div>

        <div className="d-grid gap-2">
          <button className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </div>

        <div className="text-center mt-3">
          <small>
            Already have an account? <Link to="/login">Sign in</Link>
          </small>
        </div>
      </form>
    </div>
  );
}
