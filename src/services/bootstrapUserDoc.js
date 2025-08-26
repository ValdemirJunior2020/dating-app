// src/services/bootstrapUserDoc.js
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export function initBootstrapUserDoc() {
  let ran = false;
  onAuthStateChanged(auth, async (u) => {
    if (!u || ran) return;
    ran = true;
    try {
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: u.uid,
          email: u.email || null,
          displayName: u.displayName || "",
          photoURL: u.photoURL || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          emailPrefs: { welcome: true, likes: true, messages: true },
          photos: [],
          isVisible: false
        }, { merge: true });
      } else {
        const data = snap.data() || {};
        if (!data.emailPrefs) {
          await setDoc(ref, { emailPrefs: { welcome: true, likes: true, messages: true }, updatedAt: serverTimestamp() }, { merge: true });
        }
      }
    } catch (e) {
      console.error("bootstrap user doc failed", e);
    }
  });
}
