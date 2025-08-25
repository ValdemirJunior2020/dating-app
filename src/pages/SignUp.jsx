// src/pages/SignUp.jsx
import React, { useState } from "react";
import { useLocation, Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandName from "../components/BrandName";
import { auth, signInWithGoogle } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const friendly = (code) => {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already in use. Try logging in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Please use a stronger password (at least 6 characters).";
    case "auth/operation-not-allowed":
      return "Email/Password sign-up is not enabled for this project.";
    case "auth/popup-blocked":
      return "Your browser blocked the popup. Allow popups or try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup closed. Please try again.";
    default:
      return "Sign-up failed. Please try again.";
  }
};

export default function SignUp() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || "/onboarding";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function handleGoogle() {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendly(err.code));
      console.error(err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: displayName.trim() });
      // Onboarding page will create the Firestore doc if it doesn't exist
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendly(err.code));
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="container bg-transparent">
        <div
          className="card shadow-sm p-4 auth-card mx-auto"
          style={{ maxWidth: 520 }}
        >
          <h1 className="mb-3 text-center fw-semibold" style={{ letterSpacing: ".2px" }}>
            Create your account on <BrandName />
          </h1>

          <div className="d-grid gap-2 mb-3">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleGoogle}
              aria-label="Continue with Google"
            >
              Continue with Google
            </button>
          </div>

          <div className="text-center my-2">
            <small className="form-text">or sign up with email</small>
          </div>

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="su-name" className="form-label">
                Name
              </label>
              <input
                id="su-name"
                type="text"
                className="form-control"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="su-email" className="form-label">
                Email
              </label>
              <input
                id="su-email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="su-pass" className="form-label">
                Password
              </label>
              <input
                id="su-pass"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="su-confirm" className="form-label">
                Confirm Password
              </label>
              <input
                id="su-confirm"
                type="password"
                className="form-control"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={busy}
              >
                {busy ? "Creating account…" : "Create account"}
              </button>
            </div>
          </form>

          <div className="text-center mt-3">
            <small className="form-text">
              Already have an account? <Link to="/login">Log in</Link>
            </small>
          </div>
        </div>
      </div>
    </main>
  );
}
