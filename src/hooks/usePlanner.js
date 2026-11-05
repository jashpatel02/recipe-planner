import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday",
];

const emptyPlanner = () =>
  DAYS.reduce((acc, d) => ({ ...acc, [d]: [] }), {});

function getWeekId(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function usePlanner() {
  const { user, isGuest } = useAuth();
  const [planner, setPlanner] = useState(emptyPlanner());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (!user || isGuest) {
        try {
          const saved = JSON.parse(localStorage.getItem("planner") || "{}");
          setPlanner({ ...emptyPlanner(), ...saved });
        } catch {
          setPlanner(emptyPlanner());
        }
        setLoading(false);
      } else {
        try {
          const ref = doc(db, "users", user.uid, "planner", "current");
          const snap = await getDoc(ref);
          setPlanner(snap.exists() ? { ...emptyPlanner(), ...snap.data() } : emptyPlanner());
        } catch (err) {
          console.error("Failed to load planner:", err);
          setPlanner(emptyPlanner());
        } finally {
          setLoading(false);
        }
      }
    }
    load();
  }, [user, isGuest]);

  const savePlanner = async (newPlanner) => {
    setPlanner(newPlanner);
    if (!user || isGuest) {
      localStorage.setItem("planner", JSON.stringify(newPlanner));
    } else {
      try {
        // Save current active plan
        await setDoc(doc(db, "users", user.uid, "planner", "current"), newPlanner);
        
        // Save history snapshot
        const weekId = getWeekId(new Date());
        await setDoc(doc(db, "users", user.uid, "history", weekId), {
          weekId,
          savedAt: new Date().toISOString(),
          planner: newPlanner,
        });
      } catch (err) {
        console.error("Failed to save planner:", err);
      }
    }
  };

  const loadHistory = async () => {
    if (!user || isGuest) return [];
    try {
      const ref = collection(db, "users", user.uid, "history");
      const q = query(ref, orderBy("savedAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (err) {
      console.error("Failed to load history:", err);
      throw err;
    }
  };

  return { planner, savePlanner, loading, loadHistory };
}