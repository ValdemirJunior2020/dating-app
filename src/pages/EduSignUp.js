// src/pages/EduSignUp.jsx
import React, { useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { sendEduOtp, verifyEduOtp } from "../services/edu";

export default function EduSignUp() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("enter"); // enter | sent | verified
  const [msg, setMsg] = useState("");

  async function handleSend() {
    setMsg("");
    const e = email.trim().toLowerCase();
    if (!e.endsWith(".edu")) {
      setMsg("Please enter a valid .edu email.");
      return;
    }
    const res = await sendEduOtp(e);
    if (res.ok) {
      setStep("sent");
      setMsg(res.message || "Code sent. Check your inbox.");
    } else {
      setMsg(res.error || "Failed to send code.");
    }
  }

  async function handleVerify() {
    setMsg("");
    const e = email.trim().toLowerCase();
    const c = code.trim();
    const res = await verifyEduOtp(e, c);
    if (res.ok) {
      // mark the user as verified for convenience
      const u = auth.currentUser;
      if (u) {
        await setDoc(
          doc(db, "users", u.uid),
          { eduVerified: true, verification: { college: true }, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
      setStep("verified");
      setMsg("Email verified! You can now browse.");
    } else {
      setMsg(res.error || "Invalid code.");
    }
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">Verify your .edu email</h2>

      {step !== "verified" && (
        <>
          <div className="mb-3">
            <label className="form-label">.edu email</label>
            <input
              className="form-control"
              placeholder="you@yourcollege.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {step === "enter" && (
            <button className="btn btn-primary" onClick={handleSend}>
              Send code
            </button>
          )}

          {step === "sent" && (
            <>
              <div className="mb-3 mt-3">
                <label className="form-label">6-digit code</label>
                <input
                  className="form-control"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <button className="btn btn-success" onClick={handleVerify}>
                Verify
              </button>
              <button className="btn btn-link ms-2" onClick={handleSend}>
                Resend code
              </button>
            </>
          )}
        </>
      )}

      {step === "verified" && (
        <a href="/browse" className="btn btn-success mt-3">Go to Browse</a>
      )}

      {!!msg && <div className="alert alert-info mt-3">{msg}</div>}
    </div>
  );
}
