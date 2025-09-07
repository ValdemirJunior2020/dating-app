// src/hooks/useIsAdmin.js
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

/** Hard allow-list for dev/owner convenience */
const ADMIN_EMAILS = ["infojr.83@gmail.com"];                 // <- your admin email
const ADMIN_UIDS = ["flxypBZTu5dXyJGW2asP7TvRa3w1"];          // <- your admin uid

/**
 * Returns true if the signed-in user is an admin.
 * Checks in order:
 *  1) Email/UID allow-list
 *  2) Custom claim { admin: true }
 *  3) Firestore flags users/{uid}.roles.admin or users/{uid}.admin
 */
export default function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = auth.onIdTokenChanged(async (u) => {
      try {
        if (!u) return setIsAdmin(false);

        // 1) allow-list
        const email = (u.email || "").toLowerCase().trim();
        if (ADMIN_EMAILS.includes(email) || ADMIN_UIDS.includes(u.uid)) {
          return setIsAdmin(true);
        }

        // 2) custom claim
        const token = await u.getIdTokenResult(true);
        if (token?.claims?.admin === true) return setIsAdmin(true);

        // 3) firestore role
        const snap = await getDoc(doc(db, "users", u.uid));
        const d = snap.exists() ? snap.data() : {};
        setIsAdmin(!!(d?.roles?.admin || d?.admin === true));
      } catch {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  return isAdmin;
}
