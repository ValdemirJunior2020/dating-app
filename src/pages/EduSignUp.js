import React, { useState } from "react";

const API_BASE = process.env.REACT_APP_FUNCTIONS_BASE || "";

const isEdu = (email = "") => /\.edu$/i.test(email);

export default function EduSignUp() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState("");
  const [verified, setVerified] = useState(false);

  async function sendCode(e) {
    e.preventDefault();
    setMsg("");
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setMsg("Please enter a valid email address.");
      return;
    }
    if (!isEdu(email)) {
      setMsg("Please use a valid .edu college email.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/sendEduOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to send code");
      if (data.alreadyVerified) {
        setVerified(true);
        setStep(3);
        setMsg("Email is already verified. You can continue.");
      } else {
        setStep(2);
        setMsg("Code sent! Check your inbox (valid for 10 minutes).");
      }
    } catch (err) {
      setMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e) {
    e.preventDefault();
    setMsg("");
    if (!email) {
      setMsg("Enter your .edu email first.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setMsg("Enter the 6-digit code we emailed you.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/verifyEduOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Verification failed");
      setVerified(true);
      setStep(3);
      setMsg("Verified! Continue to create your account.");
      // Optional redirect:
      // window.location.assign(`/signup?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <h2 className="mb-2">Verify your college email</h2>
      <p className="text-muted">
        We verify <b>.edu</b> emails to keep the community real, safe, and mature.
      </p>

      <form onSubmit={sendCode} className="mb-4">
        <label className="form-label">College email (.edu)</label>
        <input
          type="email"
          className="form-control mb-2"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="btn btn-dark w-100" disabled={loading}>
          {loading && step === 1 ? "Sending..." : "Send Code"}
        </button>
      </form>

      <form onSubmit={verifyCode} className="mb-2">
        <label className="form-label">6-digit code</label>
        <input
          type="text"
          inputMode="numeric"
          className="form-control mb-2"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
        <button className="btn btn-primary w-100" disabled={loading || !email}>
          {loading && step === 2 ? "Verifying..." : "Verify Code"}
        </button>
      </form>

      {msg && <div className="alert alert-info mt-3">{msg}</div>}

      {verified && (
        <div className="alert alert-success mt-3">
          <b>Success:</b> Your .edu email is verified. You can now continue to create your account.
        </div>
      )}

      <hr className="my-4" />
      <p className="small text-muted">
        Didn’t get the email? Check spam or promotions. Codes expire after 10 minutes.
      </p>
    </div>
  );
}
