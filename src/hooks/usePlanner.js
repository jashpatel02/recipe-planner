import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const emptyPlanner = () =>
  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    .reduce((acc, d) => ({ ...acc, [d]: [] }), {});

export function usePlanner() {
  const { user, isGuest } = useAuth();
  const [planner, setPlanner] = useState(emptyPlanner());
  const [loaded, setLoaded] = useState(false);

  // Load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user || isGuest) {
        // Guest / no user → localStorage only
        try {
          const saved = JSON.parse(localStorage.getItem("planner") || "null");
          if (!cancelled) setPlanner(saved || emptyPlanner());
        } catch {
          if (!cancelled) setPlanner(emptyPlanner());
        }
        setLoaded(true);
      } else {
        // Logged in → Firestore
        try {
          const ref = doc(db, "users", user.uid, "planner", "current");
          const snap = await getDoc(ref);
          if (!cancelled) {
            setPlanner(snap.exists() ? snap.data().data : emptyPlanner());
          }
        } catch (e) {
          console.error("Firestore load failed", e);
          if (!cancelled) setPlanner(emptyPlanner());
        }
        setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, isGuest]);

  const savePlanner = async (newPlanner) => {
    setPlanner(newPlanner);
    if (!user || isGuest) {
      localStorage.setItem("planner", JSON.stringify(newPlanner));
    } else {
      try {
        const ref = doc(db, "users", user.uid, "planner", "current");
        await setDoc(ref, { data: newPlanner, updatedAt: new Date().toISOString() });
        // Save history snapshot (keyed by ISO week)
        const weekId = getWeekId();
        const histRef = doc(db, "users", user.uid, "history", weekId);
        await setDoc(histRef, { data: newPlanner, weekId });
      } catch (e) {
        console.error("Firestore save failed", e);
      }
    }
  };

  return { planner, savePlanner, loaded };
}

function getWeekId() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}