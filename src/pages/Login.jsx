// src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { useLocation, Navigate, Link, useNavigate } from "react-router-dom";
import { signInWithGoogle, auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { sendEduLink, completeEduLinkIfPresent } from "../lib/eduAuth";
import BrandName from "../components/BrandName"; // cursive "Candle Love"

const friendly = (code) => {
  switch (code) {
    case "auth/operation-not-allowed":
      return "Google Sign-In is not enabled in this Firebase project.";
    case "auth/popup-blocked":
      return "Your browser blocked the popup. Allow popups or try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup closed. Please try again.";
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
  const [eduEmail, setEduEmail] = useState("");

  const params = new URLSearchParams(location.search);
  const force = params.get("force") === "1";
  const from = location.state?.from?.pathname || "/browse";

  // Always call hooks before any early returns
  useEffect(() => {
    (async () => {
      try {
        const u = await completeEduLinkIfPresent();
        if (u) {
          setMsg("You're verified and signed in with your .edu email.");
          navigate(from, { replace: true });
        }
      } catch (e) {
        console.error(e);
        setErr(e.message || "Failed to complete email link sign-in.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogle() {
    try {
      await signInWithGoogle();
    } catch (error) {
      alert(friendly(error.code));
      console.error(error);
    }
  }

  function goEmail() {
    navigate("/login-email", { state: { from: { pathname: from } } });
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
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });
      setMsg("Verification email sent! Check your inbox.");
    } catch (e) {
      console.error(e);
      setErr(e.message || "Failed to send verification email.");
    }
  }

  async function handleSendEduLink(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await sendEduLink(eduEmail);
      setMsg("Check your .edu inbox for the sign-in link.");
    } catch (e2) {
      console.error(e2);
      setErr(e2.message || "Failed to send .edu link.");
    }
  }

  return (
    <main className="auth-page">
      {/* Redirect after hooks are called, so ESLint is happy */}
      {user && !force && <Navigate to={from} replace />}

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
              aria-label="Sign in with Email"
            >
              Sign in with Email
            </button>
          </div>

          {/* .EDU Verification */}
          <div className="border-top pt-3 mt-3">
            <h6 className="mb-2">Verify your <code>.edu</code> email</h6>
            <form onSubmit={handleSendEduLink} className="d-flex gap-2">
              <input
                type="email"
                required
                className="form-control"
                placeholder="you@college.edu"
                value={eduEmail}
                onChange={(e) => setEduEmail(e.target.value)}
              />
              <button className="btn btn-success" type="submit">Send link</button>
            </form>
            <small className="text-muted d-block mt-2">
              You’ll receive a sign-in link. Opening it proves you control that .edu inbox.
            </small>
          </div>

          <div className="text-center mt-3">
            <small className="form-text">
              New here? <Link to="/signup">Create account</Link> ·{" "}
              <Link to="/reset">Forgot password?</Link>
            </small>
          </div>

          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={resendVerification}
            >
              Resend verification email
            </button>
          </div>

          {msg && <div className="alert alert-success mt-3">{msg}</div>}
          {err && <div className="alert alert-danger mt-3">{err}</div>}
        </div>
      </div>
    </main>
  );
}
