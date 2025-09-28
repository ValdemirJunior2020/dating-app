// src/lib/eduAuth.js
import { auth } from "../firebase";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

const isEdu = (email) => typeof email === "string" && /\.edu$/i.test(email);

export async function sendEduLink(email) {
  if (!isEdu(email)) throw new Error("Email must end with .edu");

  const actionCodeSettings = {
    url: `${window.location.origin}/edu-signup`,
    handleCodeInApp: true,
  };

  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem("eduEmailForSignIn", email);
  return true;
}

export async function completeEduLinkIfPresent() {
  if (!isSignInWithEmailLink(auth, window.location.href)) return null;

  let email = window.localStorage.getItem("eduEmailForSignIn");
  if (!email) email = window.prompt("Confirm your .edu email to complete sign-in:");
  if (!isEdu(email)) throw new Error("Only .edu emails are allowed");

  const cred = await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem("eduEmailForSignIn");
  return cred.user;
}
