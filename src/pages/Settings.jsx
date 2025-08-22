// src/pages/Settings.jsx
import React, { useEffect, useState, useMemo } from "react";
import { auth, db, storage } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";

/* -------------------- Helpers -------------------- */

// keep only valid Firebase download URLs
const cleanPhotos = (arr) =>
  (Array.isArray(arr) ? arr : []).filter(
    (u) => typeof u === "string" && u.includes("alt=media")
  );

// very small bad-words lists (extend as needed)
const PROFANITY_EN = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "cunt",
  "slut",
  "whore",
  "nigger",
  "faggot",
];

const PROFANITY_PT = [
  "porra",
  "caralho",
  "merda",
  "puta",
  "puto",
  "arrombado",
  "vagabunda",
  "viado",
  "otário",
  "otario",
];

// detects emails or urls
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const URL_RE =
  /\b((https?:\/\/|www\.)[^\s]+|[A-Z0-9.-]+\.[A-Z]{2,}(\/[^\s]*)?)\b/i;

// basic “nonsense” detector: too many repeated chars
const REPEAT_CHAR_RE = /(.)\1\1\1+/;

/**
 * Validate profile fields.
 * Returns { ok: boolean, issues: string[] }
 */
function validateProfile({ displayName, about }) {
  const issues = [];
  const name = (displayName || "").trim();
  const bio = (about || "").trim();

  // name required and length
  if (name.length < 2) issues.push("Name must be at least 2 characters.");
  if (name.length > 40) issues.push("Name must be 40 characters or fewer.");

  // profanity (very small lists; expand for production)
  const lowerName = name.toLowerCase();
  const lowerBio = bio.toLowerCase();

  if (PROFANITY_EN.some((w) => lowerName.includes(w)) || PROFANITY_PT.some((w) => lowerName.includes(w))) {
    issues.push("Please remove inappropriate words from your name.");
  }
  if (PROFANITY_EN.some((w) => lowerBio.includes(w)) || PROFANITY_PT.some((w) => lowerBio.includes(w))) {
    issues.push("Please remove inappropriate words from your bio.");
  }

  // no emails or urls in name/about
  if (EMAIL_RE.test(name) || URL_RE.test(name)) {
    issues.push("Please don’t include emails or links in your name.");
  }
  if (EMAIL_RE.test(bio) || URL_RE.test(bio)) {
    issues.push("Please don’t include emails or links in your bio.");
  }

  // avoid “aaaaa” etc
  if (REPEAT_CHAR_RE.test(name)) issues.push("Name looks invalid (repeated characters).");
  if (bio.length > 300) issues.push("Bio must be 300 characters or fewer.");

  return { ok: issues.length === 0, issues };
}

/* -------------------- Component -------------------- */

export default function Settings() {
  const me = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    about: "",
    photos: [],
    email: "",
  });

  const [fileList, setFileList] = useState([]); // multiple uploads

  const canSaveProfile = useMemo(
    () => form.displayName.trim().length >= 2 && !busy,
    [form.displayName, busy]
  );

  // Load current user doc
  useEffect(() => {
    async function run() {
      if (!me) return;
      setLoading(true);
      try {
        const refDoc = doc(db, "users", me.uid);
        const snap = await getDoc(refDoc);
        const d = snap.exists() ? snap.data() : {};
        setForm({
          displayName: d.displayName || me.displayName || "",
          about: d.about || "",
          photos: cleanPhotos(d.photos),
          email: d.email || me.email || "",
        });
      } finally {
        setLoading(false);
      }
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.uid]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  // Save name (and about) to both Auth and Firestore with validation
  async function saveProfile(e) {
    e?.preventDefault?.();
    if (!me) return;

    const result = validateProfile({
      displayName: form.displayName,
      about: form.about,
    });

    if (!result.ok) {
      alert(result.issues.join("\n"));
      return;
    }

    try {
      setBusy(true);
      // Update Firebase Auth profile displayName
      await updateProfile(me, { displayName: form.displayName.trim() });

      // Update Firestore user doc
      const refDoc = doc(db, "users", me.uid);
      await updateDoc(refDoc, {
        displayName: form.displayName.trim(),
        about: form.about || "",
        updatedAt: serverTimestamp(),
      });

      alert("Profile saved!");
    } catch (err) {
      console.error(err);
      alert("Could not save profile.");
    } finally {
      setBusy(false);
    }
  }

  // Handle local file selection (allow multiple)
  function onFileChange(e) {
    const files = Array.from(e.target.files || []);
    setFileList(files);
  }

  // Upload selected files and append URLs to Firestore
  async function uploadPhotos() {
    if (!me || fileList.length === 0) return;
    try {
      setBusy(true);
      const uploaded = [];
      for (const f of fileList) {
        const path = `photos/${me.uid}/${Date.now()}-${encodeURIComponent(f.name)}`;
        const r = ref(storage, path);
        await uploadBytes(r, f);
        const url = await getDownloadURL(r); // includes ?alt=media
        uploaded.push(url);
      }
      if (uploaded.length) {
        const refDoc = doc(db, "users", me.uid);
        await updateDoc(refDoc, {
          photos: arrayUnion(...uploaded),
          updatedAt: serverTimestamp(),
        });
        // refresh local state
        setForm((prev) => ({
          ...prev,
          photos: cleanPhotos([...(prev.photos || []), ...uploaded]),
        }));
        setFileList([]);
        alert("Photos uploaded!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload photos.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="container py-4">Loading…</div>;
  if (!me)
    return (
      <div className="container py-4">
        <div className="alert alert-warning">You must be signed in.</div>
      </div>
    );

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <h1 className="h4 mb-3">Settings</h1>

      <form onSubmit={saveProfile} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Display name</label>
          <input
            type="text"
            name="displayName"
            className="form-control"
            value={form.displayName}
            onChange={onChange}
            placeholder="Your name"
            maxLength={40}
            required
          />
          <div className="form-text">At least 2 characters. No emails/links.</div>
        </div>

        <div className="mb-3">
          <label className="form-label">About (optional)</label>
          <textarea
            name="about"
            className="form-control"
            rows={4}
            value={form.about}
            onChange={onChange}
            placeholder="A short bio about you"
            maxLength={300}
          />
          <div className="form-text">No profanity, emails, or links. Max 300 chars.</div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canSaveProfile}
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>

      <hr className="my-4" />

      <h2 className="h6">Photos</h2>
      {form.photos?.length ? (
        <div className="row g-3 mb-3">
          {form.photos.map((url, i) => (
            <div className="col-6 col-sm-4 col-md-3" key={url}>
              <div className="ratio ratio-1x1 rounded overflow-hidden border">
                <img
                  src={url}
                  /* IMPORTANT: avoid "photo/image/picture" words per a11y rule */
                  alt={form.displayName ? `${form.displayName}` : `User portrait`}
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-light">No photos yet.</div>
      )}

      <div className="d-flex gap-2 align-items-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onFileChange}
          className="form-control"
          style={{ maxWidth: 380 }}
        />
        <button
          className="btn btn-outline-secondary"
          onClick={uploadPhotos}
          disabled={busy || fileList.length === 0}
          type="button"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>

      <div className="form-text mt-2">
        Tip: Upload at least 3 photos so your profile appears in Browse.
      </div>
    </div>
  );
}
