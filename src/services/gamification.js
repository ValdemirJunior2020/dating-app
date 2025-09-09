// src/services/gamification.js
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "../firebase";

/** Single source of truth for badges (id, label, icon, description). */
export const BADGES = [
  { id: "first_like",   label: "First Like",      icon: "❤️", desc: "You sent your first like." },
  { id: "first_match",  label: "First Match",     icon: "💞", desc: "You made your first match." },
  { id: "chatter_10",   label: "Chatter I",       icon: "💬", desc: "Sent 10 messages." },
  { id: "chatter_100",  label: "Chatter II",      icon: "💬", desc: "Sent 100 messages." },
  { id: "streak_3",     label: "Warm Start",      icon: "🔥", desc: "3-day login streak." },
  { id: "streak_7",     label: "On a Roll",       icon: "🔥", desc: "7-day login streak." },
  { id: "streak_30",    label: "Unstoppable",     icon: "🔥", desc: "30-day login streak." },
  { id: "interests_set",label: "Dialed In",       icon: "🏷️", desc: "Saved your interests." }
];

function dayKey(d = new Date()) {
  // UTC day key to avoid TZ issues
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Ensure the 'gam' object exists for a user. */
async function ensureGamDoc(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { gam: {
      lastActiveDay: null,
      lastTs: serverTimestamp(),
      streakCurrent: 0,
      streakLongest: 0,
      badges: {},
      stats: { likesSent: 0, matches: 0, messages: 0, interestsSaves: 0 }
    }}, { merge: true });
    return (await getDoc(ref)).data()?.gam || null;
  }
  return (snap.data() || {}).gam || null;
}

/** Tick daily login streak; award streak badges. Safe to call daily on sign-in/app open. */
export async function tickDailyStreak(uid) {
  if (!uid) return null;
  const ref = doc(db, "users", uid);
  const gam = (await ensureGamDoc(uid)) || {};
  const today = dayKey();
  const last = gam.lastActiveDay;

  let streakCurrent = gam.streakCurrent || 0;
  let streakLongest = gam.streakLongest || 0;

  if (last === today) {
    // same day, nothing to change except timestamp
    await updateDoc(ref, { "gam.lastTs": serverTimestamp() });
    return { ...gam, lastActiveDay: today, streakCurrent, streakLongest };
  }

  // compute gap in days (UTC)
  let gap = 999;
  if (last) {
    const a = new Date(last + "T00:00:00Z");
    const b = new Date(today + "T00:00:00Z");
    gap = Math.round((b - a) / (24 * 3600 * 1000));
  }

  if (!last || gap > 1) streakCurrent = 1;     // reset
  else if (gap === 1)   streakCurrent += 1;    // continued

  if (streakCurrent > streakLongest) streakLongest = streakCurrent;

  // award streak badges
  const setBadges = {};
  if (streakCurrent >= 3)  setBadges["streak_3"]  = true;
  if (streakCurrent >= 7)  setBadges["streak_7"]  = true;
  if (streakCurrent >= 30) setBadges["streak_30"] = true;

  await updateDoc(ref, {
    "gam.lastActiveDay": today,
    "gam.lastTs": serverTimestamp(),
    "gam.streakCurrent": streakCurrent,
    "gam.streakLongest": streakLongest,
    ...(Object.keys(setBadges).length ? Object.fromEntries(Object.entries(setBadges).map(([k,v]) => [`gam.badges.${k}`, v])) : {})
  });

  return { ...gam, lastActiveDay: today, streakCurrent, streakLongest, badges: { ...(gam.badges||{}), ...setBadges } };
}

/**
 * Record an app event and auto-award badges.
 * events: "like_sent" | "match_created" | "message_sent" | "interests_saved"
 */
export async function recordEvent(uid, event) {
  if (!uid || !event) return null;
  const ref = doc(db, "users", uid);
  await ensureGamDoc(uid);

  const statsPath = {
    like_sent:       { path: "gam.stats.likesSent",      badge: "first_like",   min: 1 },
    match_created:   { path: "gam.stats.matches",        badge: "first_match",  min: 1 },
    message_sent:    { path: "gam.stats.messages",       badge: "chatter_10",   min: 10, badge2: "chatter_100", min2: 100 },
    interests_saved: { path: "gam.stats.interestsSaves", badge: "interests_set",min: 1 }
  };

  const mapKey = event.replace("-", "_");
  const m = statsPath[mapKey] || statsPath[event];
  if (!m) return null;

  await updateDoc(ref, {
    [m.path]: increment(1),
    "gam.lastTs": serverTimestamp()
  });

  // re-read to evaluate thresholds
  const snap = await getDoc(ref);
  const gam = (snap.data() || {}).gam || {};
  const curVal = m.path.split(".").reduce((acc,k)=>acc && acc[k], gam) || 0;

  const badgeUpdates = {};
  if (m.badge && curVal >= (m.min || 0))    badgeUpdates[`gam.badges.${m.badge}`] = true;
  if (m.badge2 && curVal >= (m.min2 || 0))  badgeUpdates[`gam.badges.${m.badge2}`] = true;

  if (Object.keys(badgeUpdates).length) {
    await updateDoc(ref, badgeUpdates);
  }
  return { gam: { ...gam, badges: { ...(gam.badges||{}), ...(Object.fromEntries(Object.entries(badgeUpdates).map(([k])=>[k.split(".").pop(), true]))) } } };
}

/** Fetch the user's gamification object. */
export async function getGamification(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return (snap.data() || {}).gam || null;
}
