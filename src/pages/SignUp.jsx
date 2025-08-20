import React, { useState } from "react";
import { emailSignUp } from "../firebase";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const errMsg = (code) => {
  switch (code) {
    case "auth/email-already-in-use": return "This email is already in use.";
    case "auth/invalid-email": return "Please enter a valid email.";
    case "auth/weak-password": return "Password should be at least 6 characters.";
    default: return "Sign up failed. Please try again.";
  }
};

export default function SignUp() {
  const { user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/onboarding" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      await emailSignUp(form.email.trim(), form.password);
      alert("Account created. We sent a verification email. You can log in now.");
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
        <h1 className="h4 mb-3 text-center">Create your account</h1>
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
          <div>
            <label className="form-label">Confirm password</label>
            <input
              name="confirm"
              type="password"
              className="form-control form-control-lg"
              value={form.confirm}
              onChange={onChange}
              required
            />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Sign up"}
          </button>
          <div className="text-center">
            <small className="text-muted">
              Already have an account? <Link to="/login-email">Log in</Link>
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
