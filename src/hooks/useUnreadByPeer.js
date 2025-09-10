// src/hooks/useUnreadByPeer.js
import { useEffect, useState } from "react";
import { listenThreadsForUser } from "../services/chat";

/**
 * Builds a Set<otherUid> that are currently unread for `uid`.
 * A thread is "unread" if thread.last exists, last.from !== uid, and !last.readBy?.[uid].
 */
export default function useUnreadByPeer(uid) {
  const [setUnread, setSetUnread] = useState(() => new Set());

  useEffect(() => {
    if (!uid) {
      setSetUnread(new Set());
      return () => {};
    }
    const unsub = listenThreadsForUser(uid, (rows) => {
      const s = new Set();
      rows.forEach((t) => {
        const last = t?.last;
        if (!last || !Array.isArray(t?.users)) return;
        const other = t.users.find((u) => u !== uid);
        const unread = last.from !== uid && !(last.readBy && last.readBy[uid]);
        if (other && unread) s.add(other);
      });
      setSetUnread(s);
    });
    return () => unsub && unsub();
  }, [uid]);

  return setUnread;
}
