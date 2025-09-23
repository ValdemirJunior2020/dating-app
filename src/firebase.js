// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// ⬇️ keep these imports; we’ll guard initialization below
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const CFG = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  appCheckSiteKey: process.env.REACT_APP_APPCHECK_SITE_KEY, // your v3 site key
  enableAppCheck: String(process.env.REACT_APP_ENABLE_APPCHECK || "").toLowerCase() === "true",
  appCheckDebugToken: process.env.REACT_APP_APPCHECK_DEBUG_TOKEN || "", // optional
};

export const app = initializeApp({
  apiKey: CFG.apiKey,
  authDomain: CFG.authDomain,
  projectId: CFG.projectId,
  storageBucket: CFG.storageBucket,
  messagingSenderId: CFG.messagingSenderId,
  appId: CFG.appId,
  measurementId: CFG.measurementId,
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ---- App Check (optional) ----
try {
  if (CFG.enableAppCheck && typeof window !== "undefined") {
    // dev debug token if you want: put that UUID from the console into .env
    if (CFG.appCheckDebugToken) {
      // eslint-disable-next-line no-underscore-dangle
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = CFG.appCheckDebugToken;
      console.info("[AppCheck] using debug token");
    }
    if (!CFG.appCheckSiteKey) {
      console.warn("[AppCheck] enabled but REACT_APP_APPCHECK_SITE_KEY is empty; skipping.");
    } else {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(CFG.appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.info("[AppCheck] initialized");
    }
  } else {
    console.info("[AppCheck] disabled");
  }
} catch (e) {
  console.warn("[AppCheck] init skipped:", e?.message || e);
}

// ---- auth helpers (unchanged) ----
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}
export async function emailSignIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export async function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}
export async function logOut() {
  return signOut(auth);
}
export default app;
