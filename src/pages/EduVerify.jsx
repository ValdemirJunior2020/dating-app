// src/pages/EduVerify.jsx
import React, { useEffect, useState } from "react";
import { sendEduLink, completeEduLinkIfPresent } from "../lib/eduAuth";
import { useAuth } from "../context/AuthContext";

export default function EduVerify() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await completeEduLinkIfPresent();
        if (u) setMsg("You're verified and signed in with your .edu email.");
      } catch (e) {
        setErr(e.message || String(e));
      }
    })();
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      await sendEduLink(email);
      setMsg("Check your .edu inbox for the sign-in link.");
    } catch (e) {
      setErr(e.message || "Failed to send link");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h2>.edu verification</h2>
      {user && <p>Signed in as: {user.email}</p>}

      <form onSubmit={handleSend} className="mt-3">
        <input
          className="form-control mb-2"
          type="email"
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="btn btn-primary w-100" type="submit">
          Send verification link
        </button>
      </form>

      {msg && <div className="alert alert-success mt-3">{msg}</div>}
      {err && <div className="alert alert-danger mt-3">{err}</div>}
    </div>
  );
}
