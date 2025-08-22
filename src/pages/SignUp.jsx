// src/pages/SignUp.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { emailSignUp } from "../firebase";
import { validateProfile } from "../utils/moderation";

export default function SignUp() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirm: "",
    bio: "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});

    if (form.password.length < 6) {
      setErrors({ password: "Password must be at least 6 characters." });
      return;
    }
    if (form.password !== form.confirm) {
      setErrors({ confirm: "Passwords do not match." });
      return;
    }

    const check = validateProfile({
      displayName: form.displayName,
      bio: form.bio,
    });
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }

    try {
      setBusy(true);
      await emailSignUp({
        email: form.email,
        password: form.password,
        displayName: check.values.displayName,
        about: check.values.bio, // stored as 'about'
      });

      // Tip: require photo upload after sign-up
      nav("/settings"); // where your uploader is
    } catch (err) {
      console.error(err);
      let msg = "Could not sign up. Please try again.";
      if (err.code === "auth/email-already-in-use") msg = "Email already in use.";
      if (err.code === "auth/invalid-email") msg = "Invalid email.";
      if (err.code === "auth/weak-password") msg = "Weak password.";
      setErrors({ _global: msg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: 520 }}>
      <h1 className="h4 mb-3">Create your account</h1>

      {errors._global && <div className="alert alert-danger">{errors._global}</div>}

      <form onSubmit={onSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label">Display name</label>
          <input
            type="text"
            className={`form-control ${errors.displayName ? "is-invalid" : ""}`}
            name="displayName"
            value={form.displayName}
            onChange={onChange}
            placeholder="e.g., Ana, João, Taylor"
            maxLength={40}
            required
          />
          {errors.displayName && <div className="invalid-feedback">{errors.displayName}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            required
          />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>

        <div className="row">
          <div className="col-12 col-md-6 mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              name="password"
              value={form.password}
              onChange={onChange}
              required
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label className="form-label">Confirm password</label>
            <input
              type="password"
              className={`form-control ${errors.confirm ? "is-invalid" : ""}`}
              name="confirm"
              value={form.confirm}
              onChange={onChange}
              required
            />
            {errors.confirm && <div className="invalid-feedback">{errors.confirm}</div>}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Bio (optional)</label>
          <textarea
            className={`form-control ${errors.bio ? "is-invalid" : ""}`}
            name="bio"
            rows={4}
            value={form.bio}
            onChange={onChange}
            placeholder="Tell people a bit about you (no emails/links/phones)."
            maxLength={300}
          />
          <div className="form-text">
            English + Português: we’ll mask profanity and block contact info.
          </div>
          {errors.bio && <div className="invalid-feedback">{errors.bio}</div>}
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>

      <div className="text-center mt-3">
        <small>
          Already have an account? <Link to="/login">Sign in</Link>
        </small>
      </div>
    </div>
  );
}
