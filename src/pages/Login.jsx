// src/pages/Login.jsx
import React from "react";
import { useLocation, Navigate, Link, useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../firebase";
import { useAuth } from "../context/AuthContext";

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
  const from = location.state?.from?.pathname || "/onboarding";

  if (user) return <Navigate to={from} replace />;

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
    <div className="container py-5">
      <div className="mx-auto card card-soft p-4" style={{ maxWidth: 480 }}>
        <h1 className="h4 mb-3 text-center">Welcome to CupidMVP</h1>
        <div className="d-grid gap-2">
          <button className="btn btn-primary btn-lg" onClick={handleGoogle}>
            Continue with Google
          </button>
          <button className="btn btn-outline-secondary btn-lg" onClick={goEmail}>
            Sign in with Email
          </button>
        </div>
        <div className="text-center mt-3">
          <small className="text-muted">
            New here? <Link to="/signup">Create account</Link> ·{" "}
            <Link to="/reset">Forgot password?</Link>
          </small>
        </div>
      </div>
    </div>
  );
}
