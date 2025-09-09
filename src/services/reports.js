// src/services/reports.js
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Save a user report to Firestore: collection "reports".
 * @param {Object} p
 * @param {string} p.reporterUid - currentUser.uid
 * @param {string} p.reportedUid - the user being reported
 * @param {string} p.reason - selected reason
 * @param {string} [p.details] - optional free text
 * @param {Object} [p.context] - optional extras (where it happened, matchId, messageId)
 * @returns {Promise<string>} report document id
 */
export async function submitReport({ reporterUid, reportedUid, reason, details = "", context = {} }) {
  if (!reporterUid || !reportedUid || !reason) {
    throw new Error("Missing required fields (reporterUid, reportedUid, reason)");
  }

  const docRef = await addDoc(collection(db, "reports"), {
    reporterUid,
    reportedUid,
    reason,
    details,
    context,
    status: "open",            // for future admin review
    createdAt: serverTimestamp()
  });

  return docRef.id;
}
