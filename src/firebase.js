// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ---- Firebase config from your .env ----
// Make sure all of these exist with the REACT_APP_ prefix
// and restart `npm start` after any .env change.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  // Optional:
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// ---- Init core SDKs ----
const app = initializeApp(firebaseConfig);
export default app;

export const auth = getAuth(app);
auth.useDeviceLanguage();
// Persist auth across tabs/reloads
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);
export const storage = getStorage(app);

// ---- Providers & helpers your app imports ----
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  // Popup sign-in
  return await signInWithPopup(auth, googleProvider);
};

export const emailSignIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const sendReset = (email) => sendPasswordResetEmail(auth, email);

export const logOut = () => signOut(auth);

// ---- App Check (disable in dev to avoid 403 debug-token errors) ----
const appCheckSiteKey = process.env.REACT_APP_APPCHECK_SITE_KEY;

// Only enable App Check in production. This prevents the 403 spam in local dev.
if (process.env.NODE_ENV === "production" && appCheckSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}
// If you want App Check in dev, register a debug token in Console and
// then enable it here (avoid using `self` to keep ESLint happy).
// Example:
// if (process.env.NODE_ENV !== "production") {
//   // window is OK in the browser and won’t trigger the 'self' ESLint rule
//   window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
//   initializeAppCheck(app, {
//     provider: new ReCaptchaV3Provider(appCheckSiteKey),
//     isTokenAutoRefreshEnabled: true,
//   });
// }
