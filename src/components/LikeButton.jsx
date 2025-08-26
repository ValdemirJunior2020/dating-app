import React, { useState } from "react";
import { sendLike } from "../services/likes";

export default function LikeButton({ toUid, className = "" }) {
  const [busy, setBusy] = useState(false);
  async function onLike() {
    if (!toUid) return;
    setBusy(true);
    try { await sendLike(toUid); } 
    catch (e) { console.error(e); alert("Could not like."); } 
    finally { setBusy(false); }
  }
  return (
    <button type="button" className={`btn btn-primary ${className}`} onClick={onLike} disabled={busy}>
      {busy ? "Liking…" : "Like 💛"}
    </button>
  );
}
