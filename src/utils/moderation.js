// src/utils/moderation.js
import leo from "leo-profanity";

/** Portuguese words to add to the default EN dictionary */
const ptWords = [
  "merda","porra","caralho","bosta","puta","puto","fdp",
  "vagabunda","vagabundo","desgraça","arrombado"
];

let initialized = false;

export function initModeration() {
  if (initialized) return;
  leo.loadDictionary(); // EN
  leo.add(ptWords);     // add PT
  initialized = true;
}

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}(?!\S)/i;
const urlRegex   = /\b(https?:\/\/|www\.)[^\s/$.?#].[^\s]*\b/i;
const phoneRegex = /\b(\+?\d[\d\s().-]{7,})\b/;

export function normalizeText(s = "") {
  return String(s).replace(/\s+/g, " ").trim();
}

/** Validates general text + masks profanity. */
export function validateText(text, { min = 0, max = 300 } = {}) {
  initModeration();
  const normalized = normalizeText(text);

  if (normalized.length < min) {
    return { ok: false, reason: `Must be at least ${min} characters.`, cleaned: normalized };
  }
  if (normalized.length > max) {
    return { ok: false, reason: `Must be at most ${max} characters.`, cleaned: normalized.slice(0, max) };
  }

  const hasProfanity = leo.check(normalized);
  const cleaned = hasProfanity ? leo.clean(normalized) : normalized;

  if (emailRegex.test(normalized)) return { ok: false, reason: "Please don’t include email addresses.", cleaned };
  if (urlRegex.test(normalized))   return { ok: false, reason: "Please don’t include links.", cleaned };
  if (phoneRegex.test(normalized)) return { ok: false, reason: "Please don’t include phone numbers.", cleaned };

  return { ok: true, reason: null, cleaned };
}

/** Validates sign-up profile inputs. */
export function validateProfile({ displayName = "", bio = "" }) {
  const out = { ok: true, errors: {}, values: {} };

  const name = normalizeText(displayName);
  if (name.length < 2) out.errors.displayName = "Name must be at least 2 characters.";
  else if (name.length > 40) out.errors.displayName = "Name must be at most 40 characters.";
  else if (!/^[\p{L}\p{N} .'-]+$/u.test(name)) out.errors.displayName = "Name has invalid characters.";
  out.values.displayName = name;

  const bioRes = validateText(bio, { min: 0, max: 300 });
  if (!bioRes.ok) out.errors.bio = bioRes.reason;
  out.values.bio = bioRes.cleaned;

  if (Object.keys(out.errors).length) out.ok = false;
  return out;
}
