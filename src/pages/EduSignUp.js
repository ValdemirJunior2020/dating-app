// src/pages/EduSignUp.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase"; // removed: auth
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { sendEduLink, completeEduLinkIfPresent } from "../lib/eduAuth";
import { useNavigate, useLocation } from "react-router-dom";

export default function EduSignUp() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/browse";

  // If opened from the email link, complete the sign-in
  useEffect(() => {
    (async () => {
      try {
        const user = await completeEduLinkIfPresent();
        if (user) {
          await setDoc(
            doc(db, "users", user.uid),
            {
              eduVerified: true,
              verification: { college: true },
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
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

  async function handleSend(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    const eaddr = email.trim().toLowerCase();
    if (!/\.edu$/i.test(eaddr)) {
      setErr("Please enter a valid .edu email.");
      return;
    }

    try {
      await sendEduLink(eaddr);
      setSent(true);
      setMsg("Check your .edu inbox and click the sign-in link.");
    } catch (e2) {
      console.error(e2);
      setErr(e2.message || "Failed to send the .edu sign-in link.");
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: 520 }}>
      <h2 className="mb-3">Verify your .edu email</h2>

      <form onSubmit={handleSend}>
        <label className="form-label">.edu email</label>
        <input
          className="form-control"
          type="email"
          placeholder="you@yourcollege.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button className="btn btn-primary mt-3" type="submit">
          {sent ? "Resend link" : "Send link"}
        </button>
      </form>

      <p className="text-muted mt-3">
        We’ll email you a sign-in link. Opening it proves you control that .edu inbox.
      </p>

      {msg && <div className="alert alert-success mt-3">{msg}</div>}
      {err && <div className="alert alert-danger mt-3">{err}</div>}
    </div>
  );
}
