import React from "react";
import { getApps } from "firebase/app";
import { auth } from "../firebase";

export default function Health() {
  const app = getApps()[0];
  const opts = app?.options || {};
  const [uid, setUid] = React.useState(auth.currentUser?.uid || null);

  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUid(u?.uid || null));
    return () => unsub();
  }, []);

  return (
    <div className="container py-4">
      <h2 className="mb-3">Health</h2>
      <div className="card p-3">
        <div><strong>projectId:</strong> {String(opts.projectId || "")}</div>
        <div><strong>storageBucket:</strong> {String(opts.storageBucket || "")}</div>
        <div><strong>auth.currentUser.uid:</strong> {uid || "(not signed in)"}</div>
      </div>
      <p className="text-muted mt-3">
        Expected: projectId = <code>review-45013</code>, storageBucket = <code>review-45013.appspot.com</code>.
      </p>
    </div>
  );
}
