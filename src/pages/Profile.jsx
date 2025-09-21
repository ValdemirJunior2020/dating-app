// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { uploadPublicPhoto } from "../services/storage";

export default function Profile() {
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [about, setAbout] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!uid) return;
      try {
        setBusy(true);
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists() && !cancelled) {
          const u = snap.data();
          setDisplayName(u.displayName || "");
          setAbout(u.about || "");
          setPhone(u.phone || "");
          setDob(u.dob || "");
          setPhotoUrl(u.photoUrl || "");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr(e?.message || "Failed to load profile");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  async function saveProfile(e) {
    e.preventDefault();
    if (!uid) return setErr("Please sign in.");
    try {
      setErr(""); setOk("");
      setBusy(true);
      await updateDoc(doc(db, "users", uid), {
        displayName: displayName.trim(),
        about: about.trim(),
        phone: phone.trim(),
        dob,
      });
      setOk("Profile updated ✅");
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Profile update failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!uid) return setErr("Please sign in to upload.");
    setErr(""); setOk("");
    try {
      setPhotoBusy(true);

      const { url, fullPath } = await uploadPublicPhoto(file);
      setPhotoUrl(url);
      await updateDoc(doc(db, "users", uid), { photoUrl: url, photoPath: fullPath });
      setOk("Photo updated ✅");
    } catch (ex) {
      // try to surface Firebase Storage server message
      let msg = ex?.message || "Upload failed";
      try {
        if (ex?.serverResponse) {
          const j = JSON.parse(ex.serverResponse);
          msg = j?.error || msg;
        }
      } catch {}
      console.error("[upload]", ex);
      setErr(msg);
    } finally {
      setPhotoBusy(false);
      e.target.value = ""; // allow same file reselect
    }
  }

  if (!uid) {
    return (
      <main className="container py-4">
        <div className="alert alert-warning">Please sign in to edit your profile.</div>
      </main>
    );
  }

  return (
    <main className="container py-4">
      <h1 className="mb-3">Your profile</h1>

      <div className="row g-3">
        {/* Photo card */}
        <div className="col-md-5">
          <div className="card p-3">
            <label className="form-label">Profile photo</label>
            {photoUrl && (
              <img
                src={photoUrl}
                alt="profile"
                style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 12 }}
                className="mb-2"
              />
            )}
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={onSelect}
              disabled={photoBusy || busy}
            />
            {photoBusy && <div className="mt-2">Uploading…</div>}
          </div>
        </div>

        {/* Details card */}
        <div className="col-md-7">
          <form onSubmit={saveProfile} className="card p-3 d-grid gap-3">
            <div>
              <label className="form-label">Display name</label>
              <input
                className="form-control"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={busy}
              />
            </div>

            <div>
              <label className="form-label">About</label>
              <textarea
                className="form-control"
                rows={4}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                disabled={busy}
              />
            </div>

            <div>
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                placeholder="+15555551234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={busy}
              />
            </div>

            <div>
              <label className="form-label">Date of birth</label>
              <input
                type="date"
                className="form-control"
                value={dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDob(e.target.value)}
                disabled={busy}
              />
            </div>

            {err && <div className="alert alert-danger m-0">{err}</div>}
            {ok && <div className="alert alert-success m-0">{ok}</div>}

            <div className="d-flex gap-2">
              <button className="btn btn-primary" disabled={busy}>Save</button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={busy}
                onClick={() => { setErr(""); setOk(""); }}
              >
                Clear status
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
