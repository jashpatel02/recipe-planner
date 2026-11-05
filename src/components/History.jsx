import { useEffect, useState } from "react";
import { usePlanner } from "../hooks/usePlanner";
import { useAuth } from "../contexts/AuthContext";

export default function History({ onClose }) {
  const { loadHistory } = usePlanner();
  const { user, isGuest } = useAuth();
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isGuest) {
      setLoading(false);
      return;
    }
    loadHistory().then((data) => {
      setWeeks(data);
      setLoading(false);
    });
  }, [user, isGuest]);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>📜 Your History</h2>
        {isGuest && (
          <p className="hint">Guest mode — sign in to save your weekly plans.</p>
        )}
        {loading && <p>Loading...</p>}
        {!loading && weeks.length === 0 && !isGuest && (
          <p className="hint">No saved weeks yet. Your plans will appear here.</p>
        )}
        <div className="history-list">
          {weeks.map((w) => (
            <div key={w.weekId} className="history-item">
              <h3>{w.weekId}</h3>
              <p className="hint">
                Saved {new Date(w.savedAt).toLocaleDateString()}
              </p>
              <div className="history-meals">
                {Object.entries(w.planner || {}).map(([day, meals]) =>
                  meals.length > 0 ? (
                    <div key={day} className="history-day">
                      <strong>{day}:</strong> {meals.map((m) => m.strMeal).join(", ")}
                    </div>
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}