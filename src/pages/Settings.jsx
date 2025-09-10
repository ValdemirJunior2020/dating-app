// src/pages/Settings.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, updateNotificationPrefs } from "../services/users";
import { useToast } from "../components/Toaster";
import { RecaptchaVerifier, linkWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";

function isValidPhone(p) {
  if (!p) return false;
  const s = String(p).trim();
  // Expect E.164 or near-E.164 (+country code). Keep it loose for UX.
  return /^\+?[0-9()\-\s]{7,}$/.test(s);
}

export default function Settings() {
  const { currentUser } = useAuth() || {};
  const toast = useToast();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");

  const [phone, setPhone] = React.useState("");
  const [smsOptIn, setSmsOptIn] = React.useState(false);
  const [emailOptIn, setEmailOptIn] = React.useState(true);
  const [notifyOnLike, setNotifyOnLike] = React.useState(true);
  const [notifyOnMatch, setNotifyOnMatch] = React.useState(true);
  const [smsVerified, setSmsVerified] = React.useState(false);

  // OTP state
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [codeSent, setCodeSent] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const confirmationRef = React.useRef(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!currentUser?.uid) { setLoading(false); return; }
      try {
        const doc = await getUserProfile(currentUser.uid);
        if (!alive) return;
        setPhone(doc?.phone || "");
        setSmsOptIn(!!doc?.smsOptIn);
        setEmailOptIn(doc?.emailOptIn !== false);
        setNotifyOnLike(doc?.notifyOnLike !== false);
        setNotifyOnMatch(doc?.notifyOnMatch !== false);
        setSmsVerified(!!doc?.smsVerified);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [currentUser?.uid]);

  const onSave = async () => {
    setErr("");
    if (phone && !isValidPhone(phone)) { setErr("Please enter a valid phone number (or clear it)."); return; }
    try {
      setSaving(true);
      await updateNotificationPrefs(currentUser.uid, {
        phone: phone.trim() || null,
        smsOptIn,
        emailOptIn,
        notifyOnLike,
        notifyOnMatch
      });
      toast.show({ title: "Settings saved", icon: "✅", duration: 2200 });
    } catch (e) {
      console.error(e);
      setErr(e?.message || String(e));
      toast.show({ title: "Could not save", desc: String(e?.message || e), icon: "⚠️" });
    } finally {
      setSaving(false);
    }
  };

  // Create (or reuse) invisible reCAPTCHA verifier
  function getRecaptcha() {
    const key = "__recaptchaVerifier";
    if (window[key]) return window[key];
    window[key] = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible"
    });
    return window[key];
  }

  const sendOtp = async () => {
    setErr("");
    if (!currentUser?.uid) { setErr("You must be signed in."); return; }
    const p = phone.trim();
    if (!isValidPhone(p) || !p.startsWith("+")) {
      setErr("Use international format with +country code (e.g., +15551234567).");
      return;
    }

    try {
      setSendingOtp(true);
      const appVerifier = getRecaptcha();
      // Link phone to the current user (not a new sign-in)
      const confirmation = await linkWithPhoneNumber(currentUser, p, appVerifier);
      confirmationRef.current = confirmation;
      setCodeSent(true);
      setOtpCode("");
      toast.show({ title: "Code sent", desc: "Check your phone for the SMS code.", icon: "📲", duration: 2800 });
    } catch (e) {
      console.error(e);
      setErr(e?.message || String(e));
      toast.show({ title: "Could not send code", desc: String(e?.message || e), icon: "⚠️" });
      try { window.__recaptchaVerifier?.clear(); window.__recaptchaVerifier = null; } catch {}
    } finally {
      setSendingOtp(false);
    }
  };

  const confirmOtp = async () => {
    setErr("");
    const confirmation = confirmationRef.current;
    if (!confirmation) { setErr("No verification in progress. Send the code first."); return; }
    if (!otpCode.trim()) { setErr("Enter the 6-digit code from SMS."); return; }

    try {
      await confirmation.confirm(otpCode.trim());
      setSmsVerified(true);
      await updateNotificationPrefs(currentUser.uid, { smsVerified: true, phone: phone.trim() || null });
      toast.show({ title: "Phone verified", icon: "🎉", duration: 2600 });
      setCodeSent(false);
      setOtpCode("");
    } catch (e) {
      console.error(e);
      setErr(e?.message || String(e));
      toast.show({ title: "Invalid code", desc: "Please check the SMS code and try again.", icon: "⚠️" });
    }
  };

  return (
    <div className="container" style={{ padding: 16, maxWidth: 720 }}>
      <style>{`.container * { color: #fff !important; font-weight: 700 }`}</style>
      <h2 style={{ marginTop: 0 }}>Settings</h2>

      {loading ? (
        <div className="card" style={{ padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.35)" }}>
          Loading…
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 16, borderRadius: 12, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.35)", marginBottom: 12 }}>
            <h5 className="mb-3">Contact & Notifications</h5>

            <div className="mb-3">
              <label className="form-label">Phone (optional)</label>
              <input className="form-control" placeholder="+1 555 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <div className="form-text" style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>
                {smsVerified ? "Phone verified ✅" : "Unverified phone — verify to receive SMS alerts."}
              </div>
            </div>

            <div className="form-check mb-2">
              <input id="smsOptIn" className="form-check-input" type="checkbox" checked={smsOptIn} onChange={(e)=>setSmsOptIn(e.target.checked)} />
              <label className="form-check-label" htmlFor="smsOptIn">Text me updates (likes & matches)</label>
            </div>

            <div className="form-check mb-2">
              <input id="emailOptIn" className="form-check-input" type="checkbox" checked={emailOptIn} onChange={(e)=>setEmailOptIn(e.target.checked)} />
              <label className="form-check-label" htmlFor="emailOptIn">Email me updates</label>
            </div>

            <div className="form-check mb-2">
              <input id="notifyOnLike" className="form-check-input" type="checkbox" checked={notifyOnLike} onChange={(e)=>setNotifyOnLike(e.target.checked)} />
              <label className="form-check-label" htmlFor="notifyOnLike">Notify on Like</label>
            </div>

            <div className="form-check mb-2">
              <input id="notifyOnMatch" className="form-check-input" type="checkbox" checked={notifyOnMatch} onChange={(e)=>setNotifyOnMatch(e.target.checked)} />
              <label className="form-check-label" htmlFor="notifyOnMatch">Notify on Match</label>
            </div>

            {err && <div className="alert alert-danger mt-2">{err}</div>}

            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-primary" onClick={onSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              {/* OTP actions */}
              <button className="btn btn-outline-light" type="button" disabled={sendingOtp || !isValidPhone(phone)} onClick={sendOtp}>
                {sendingOtp ? "Sending code…" : "Verify via SMS"}
              </button>
              {codeSent && (
                <>
                  <input
                    className="form-control"
                    style={{ maxWidth: 160 }}
                    placeholder="6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                  <button className="btn btn-outline-light" type="button" onClick={confirmOtp}>
                    Confirm code
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Invisible reCAPTCHA anchor */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
