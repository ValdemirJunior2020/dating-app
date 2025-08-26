// src/pages/Login.jsx
import React from "react";
import { useLocation, Navigate, Link, useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../firebase";
import { useAuth } from "../context/AuthContext";
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

  // allow viewing this page while signed in if ?force=1
  const params = new URLSearchParams(location.search);
  const force = params.get("force") === "1";

  // safer fallback: if you really want /onboarding keep it; otherwise /browse avoids blanks
  const from = location.state?.from?.pathname || "/browse";

  if (user && !force) return <Navigate to={from} replace />;

  async function handleGoogle() {
    try {
      await signInWithGoogle();
    } catch (err) {
      alert(friendly(err.code));
      console.error(err);
    }
  }

  function goEmail() {
    navigate("/login-email", { state: { from: { pathname: from } } });
  }

  return (
    // Uses .auth-page and .auth-card classes in global.css
    <main className="auth-page">
      <div className="container bg-transparent">
        <div className="card shadow-sm p-4 auth-card mx-auto" style={{ maxWidth: 520 }}>
          <h1 className="mb-3 text-center fw-semibold" style={{ letterSpacing: ".2px" }}>
            Welcome to <BrandName />
          </h1>

          <div className="d-grid gap-2">
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

          <div className="text-center mt-3">
            <small className="form-text">
              New here? <Link to="/signup">Create account</Link> ·{" "}
              <Link to="/reset">Forgot password?</Link>
            </small>
          </div>
        </div>
      </div>
    </main>
  );
}
