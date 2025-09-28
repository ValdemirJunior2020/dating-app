// src/pages/Login.jsx
import React, { useState } from "react";
import { useLocation, Navigate, Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import BrandName from "../components/BrandName";

// Friendlier messages for common popup errors
const friendly = (code) => {
  switch (code) {
    case "auth/operation-not-allowed":
      return "Google Sign-In is not enabled in this Firebase project.";
    case "auth/popup-blocked":
      return "Your browser blocked the popup. Allow popups or try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup closed. Please try again.";
    case "auth/invalid-continue-uri":
      return "The continue URL is not allowed. Add your live domain in Firebase Auth → Authorized domains.";
    default:
      return "Sign-in failed. Please try again.";
  }
};

export default function Login() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  // allow viewing this page while signed in if ?force=1
  const params = new URLSearchParams(location.search);
  const force = params.get("force") === "1";

  const from = location.state?.from?.pathname || "/browse";

  if (user && !force) return <Navigate to={from} replace />;

  async function handleGoogle() {
    setMsg(""); setErr("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // success navigates via your auth guard elsewhere; if not, you can:
      // navigate(from, { replace: true });
    } catch (e) {
      console.error(e);
      alert(friendly(e?.code));
    }
  }

  function goEmail() {
    navigate("/login-email", { state: { from: { pathname: from } } });
  }

  async function handleEmailPassword(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await signInWithEmailAndPassword(auth, email, pwd);
      navigate(from, { replace: true });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Sign-in failed.");
    }
  }

  async function resendVerification() {
    setMsg(""); setErr("");
    try {
      if (!auth.currentUser) {
        setErr("You must log in with email/password first.");
        return;
      }
      if (auth.currentUser.emailVerified) {
        setMsg("Your email is already verified.");
        return;
      }

      // SAFEST: do not pass an actionCodeSettings URL (avoids invalid-continue-uri).
      await sendEmailVerification(auth.currentUser);

      // If you insist on a URL, ensure the domain is on Firebase Auth → Authorized domains:
      // await sendEmailVerification(auth.currentUser, {
      //   url: `${window.location.origin}/login`, // e.g. https://candlelove.club/login
      //   handleCodeInApp: true,
      // });

      setMsg("Verification email sent! Check your inbox.");
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to send verification email.");
    }
  }

  async function sendReset() {
    setMsg(""); setErr("");
    try {
      if (!email) {
        setErr("Enter your email first to receive a reset link.");
        return;
      }
      // Same idea as above: omit actionCodeSettings to avoid continue-uri issues.
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset email sent.");
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to send password reset email.");
    }
  }

  return (
    <main className="auth-page">
      <div className="container bg-transparent">
        <div className="card shadow-sm p-4 auth-card mx-auto" style={{ maxWidth: 520 }}>
          <h1 className="mb-3 text-center fw-semibold" style={{ letterSpacing: ".2px" }}>
            Welcome to <BrandName />
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

            <button
              type="button"
              className="btn btn-outline-secondary btn-lg"
              onClick={goEmail}
              aria-label="Sign in with Email page"
            >
              Sign in with Email (page)
            </button>
          </div>

          <form onSubmit={handleEmailPassword} className="mb-2" style={{ display: "grid", gap: 8 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="form-control"
            />
            <input
              type="password"
              placeholder="Password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="current-password"
              required
              className="form-control"
            />
            <button type="submit" className="btn btn-success">Sign In</button>
          </form>

          <div className="d-flex gap-2">
            <button type="button" onClick={sendReset} className="btn btn-outline-light btn-sm">
              Send password reset
            </button>
            <button type="button" onClick={resendVerification} className="btn btn-outline-light btn-sm">
              Resend verification email
            </button>
          </div>

          <div className="text-center mt-3">
            <small className="form-text">
              New here? <Link to="/signup">Create account</Link> ·{" "}
              <Link to="/reset">Forgot password?</Link>
            </small>
          </div>

          {msg && <div className="alert alert-success mt-3">{msg}</div>}
          {err && <div className="alert alert-danger mt-3">{err}</div>}
        </div>
      </div>
    </main>
  );
}
