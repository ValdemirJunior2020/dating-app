import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";

export default function FixPhotos() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [log, setLog] = useState([]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const uref = doc(db, "users", uid);
      const snap = await getDoc(uref);
      if (!snap.exists()) return setLog(l => [...l, "No user doc."]);
      const data = snap.data();
      const arr = Array.isArray(data.photos) ? data.photos : [];

      const fixed = [];
      for (const item of arr) {
        if (typeof item === "string" && item.includes("alt=media")) {
          fixed.push(item); // already valid
        } else if (typeof item === "string" && item.includes("o?name=")) {
          try {
            const encoded = item.split("o?name=")[1];
            const path = decodeURIComponent(encoded);
            const url = await getDownloadURL(ref(storage, path));
            fixed.push(url);
            setLog(l => [...l, `Converted ${path}`]);
          } catch (e) {
            setLog(l => [...l, `Failed to convert: ${item}`]);
          }
        } else if (typeof item === "string" && item.startsWith("photos/")) {
          try {
            const url = await getDownloadURL(ref(storage, item));
            fixed.push(url);
            setLog(l => [...l, `Converted ${item}`]);
          } catch {
            setLog(l => [...l, `Missing file for ${item}`]);
          }
        }
      }

      await updateDoc(uref, { photos: fixed, updatedAt: Date.now() });
      setLog(l => [...l, `Done. Saved ${fixed.length} valid URLs.`]);
    })();
  }, [uid]);

  return (
    <div className="container py-4">
      <h2>Fix Photos</h2>
      <pre className="bg-light p-3" style={{ whiteSpace: "pre-wrap" }}>{log.join("\n")}</pre>
    </div>
  );
}
