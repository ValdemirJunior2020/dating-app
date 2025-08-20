// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUOk9E2SAXZvARgQSFQVeEGoRMWLWDbiI",
  authDomain: "review-45013.firebaseapp.com",
  projectId: "review-45013",
  storageBucket: "review-45013.firebasestorage.app",
  messagingSenderId: "198812507562",
  appId: "1:198812507562:web:fb9352cc9aafd3361a5fd3",
  measurementId: "G-972PGXEDB3"
};

// initialize firebase
const app = initializeApp(firebaseConfig);

// auth
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logOut = () => signOut(auth);

// firestore
export const db = getFirestore(app);
