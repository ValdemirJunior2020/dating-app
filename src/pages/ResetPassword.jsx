import React, { useState } from "react";
import { sendReset } from "../firebase";
import { Link } from "react-router-dom";

const errMsg = (code) => {
  switch (code) {
    case "auth/missing-email": return "Please enter your email.";
    case "auth/invalid-email": return "Please enter a valid email.";
    case "auth/user-not-found": return "No account found with this email.";
    default: return "Unable to send reset email right now.";
  }
};

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      await sendReset(email.trim());
      setSent(true);
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
        <h1 className="h4 mb-3 text-center">Reset password</h1>
        {sent ? (
          <div className="alert alert-success">
            If an account exists for <strong>{email}</strong>, we’ve sent a password reset email.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="d-grid gap-3">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control form-control-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <div className="text-center mt-3">
          <small><Link to="/login-email">Back to login</Link></small>
        </div>
      </div>
    </div>
  );
}
