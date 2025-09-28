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
// Leave App Check OFF until everything else is working
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ---- Config from env (must be set in Netlify) ----
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID, // optional
};

const app = initializeApp(firebaseConfig);
export default app;

export const auth = getAuth(app);
auth.useDeviceLanguage();
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);
export const storage = getStorage(app);

// Providers & helpers
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const emailSignIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const sendReset = (email) => sendPasswordResetEmail(auth, email);
export const logOut = () => signOut(auth);

// ---- App Check (DISABLED for now) ----
// const enableAppCheck = String(process.env.REACT_APP_ENABLE_APPCHECK || "false").toLowerCase() === "true";
// const appCheckSiteKey = process.env.REACT_APP_APPCHECK_SITE_KEY;
// if (enableAppCheck && appCheckSiteKey) {
//   initializeAppCheck(app, {
//     provider: new ReCaptchaV3Provider(appCheckSiteKey),
//     isTokenAutoRefreshEnabled: true,
//   });
// }
