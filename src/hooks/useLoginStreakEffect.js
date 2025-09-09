// src/hooks/useLoginStreakEffect.js
import { useEffect } from "react";
import { tickDailyStreak, BADGES } from "../services/gamification";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toaster";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}
function badgeMeta(id) {
  return BADGES.find(b => b.id === id) || { label: id, icon: "🏆", desc: "" };
}

/** Tick streak once/day and toast new streak badges (3,7,30) */
export default function useLoginStreakEffect() {
  const { currentUser } = useAuth() || {};
  const toast = useToast();

  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) return;

    // tick at most once per day per device
    const tkey = `streak-tick:${uid}`;
    const today = todayKey();
    if (localStorage.getItem(tkey) === today) return;

    (async () => {
      const gam = await tickDailyStreak(uid);
      localStorage.setItem(tkey, today);

      const badges = gam?.badges || {};
      const streakIds = ["streak_3", "streak_7", "streak_30"];
      for (const id of streakIds) {
        if (badges[id]) {
          const seenKey = `badge-shown:${uid}:${id}`;
          if (!localStorage.getItem(seenKey)) {
            const b = badgeMeta(id);
            toast.show({
              title: `Badge unlocked: ${b.label}`,
              desc: b.desc || "Nice work!",
              icon: b.icon || "🔥",
              duration: 4200
            });
            localStorage.setItem(seenKey, "1");
          }
        }
      }
    })();
  }, [currentUser?.uid, toast]);
}
