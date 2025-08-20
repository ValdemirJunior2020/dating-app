import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import { signInWithGoogle } from "../firebase";
import { useAuth } from "../context/AuthContext";

const friendly = (code) => {
  switch (code) {
    case "auth/operation-not-allowed":
      return "Google Sign-In is not enabled for this Firebase project. Enable it in Firebase Console → Authentication → Sign-in method.";
    case "auth/popup-blocked":
      return "Your browser blocked the popup. Allow popups for localhost or try again.";
    case "auth/cancelled-popup-request":
    case "auth/popup-closed-by-user":
      return "Sign-in popup closed. Please try again.";
    default:
      return "Sign-in failed. Please try again.";
  }
};

export default function Login() {
  const { user } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/onboarding";

  if (user) return <Navigate to={from} replace />;

  async function handleLogin() {
    try {
      await signInWithGoogle();
    } catch (err) {
      alert(friendly(err.code));
      console.error(err);
    }
  }

  return (
    <div className="container py-5">
      <div className="mx-auto card card-soft p-4" style={{ maxWidth: 480 }}>
        <h1 className="h4 mb-3 text-center">Welcome to CupidMVP</h1>
        <p className="text-muted text-center mb-4">Sign in to start your profile.</p>
        <div className="d-grid">
          <button className="btn btn-primary btn-lg" onClick={handleLogin}>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
