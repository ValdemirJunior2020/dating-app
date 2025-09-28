// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore, initializeFirestore } from "firebase/firestore";
// Optional later: import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,      // review-45013.firebaseapp.com
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,        // review-45013
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, // review-45013.appspot.com
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Guard: fail fast in dev if a critical env is missing
["REACT_APP_FIREBASE_API_KEY","REACT_APP_FIREBASE_AUTH_DOMAIN",
 "REACT_APP_FIREBASE_PROJECT_ID","REACT_APP_FIREBASE_APP_ID"].forEach((k)=>{
  if (!process.env[k] && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(`[ENV MISSING] ${k}`);
  }
});

export const app = initializeApp(firebaseConfig);

// Log once to verify correct projectId/authDomain on live
try { console.log("[FB]", app.options.projectId, app.options.authDomain, window.location.origin); } catch {}

export const auth = getAuth(app);
auth.useDeviceLanguage();
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Firestore: enable long-poll fallback to avoid network/proxy/CSP issues
initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});
export const db = getFirestore(app);

export const storage = getStorage(app);

// Helpers your app imports
export const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const emailSignIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const sendReset = (email) => sendPasswordResetEmail(auth, email);
export const logOut = () => signOut(auth);

// App Check: turn on only after site is stable and keys/domains are set
// const enableAppCheck = String(process.env.REACT_APP_ENABLE_APPCHECK || "").toLowerCase() === "true";
// const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
// if (enableAppCheck && siteKey) {
//   initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true });
// }
