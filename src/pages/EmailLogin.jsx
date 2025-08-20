// src/pages/EmailLogin.jsx
import React, { useState } from "react";
import { emailSignIn } from "../firebase";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const errMsg = (code) => {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Please enter a valid email.";
    default:
      return "Login failed. Please try again.";
  }
};

export default function EmailLogin() {
  const { user } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/onboarding";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      await emailSignIn(form.email.trim(), form.password);
    } catch (err) {
      alert(errMsg(err.code));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="mx-auto card card-soft p-4" style={{ maxWidth: 480 }}>
        <h1 className="h4 mb-3 text-center">Log in with Email</h1>
        <form onSubmit={handleSubmit} className="d-grid gap-3">
          <div>
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              className="form-control form-control-lg"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              className="form-control form-control-lg"
              value={form.password}
              onChange={onChange}
              required
            />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Log in"}
          </button>
          <div className="d-flex justify-content-between">
            <small><Link to="/reset">Forgot password?</Link></small>
            <small className="text-muted">New here? <Link to="/signup">Create account</Link></small>
          </div>
        </form>
      </div>
    </div>
  );
}
