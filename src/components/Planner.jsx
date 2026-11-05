import { useState } from "react";

const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday",
];

export default function Planner({ planner, onDropMeal, onRemove, onClear }) {
  const [dragOver, setDragOver] = useState(null);

  const handleDrop = (e, day) => {
    e.preventDefault();
    setDragOver(null);
    const raw = e.dataTransfer.getData("application/json");
    if (raw) {
      try {
        const meal = JSON.parse(raw);
        onDropMeal(day, meal);
      } catch (err) {
        console.error("Invalid drop data", err);
      }
    }
  };

  return (
    <section className="panel planner-panel">
      <h2>📅 Weekly Planner</h2>
      <div className="planner-grid">
        {DAYS.map((day) => (
          <div
            key={day}
            className={`day-slot ${dragOver === day ? "drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(day);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, day)}
          >
            <h4>{day}</h4>
            {planner[day]?.map((item) => (
              <div key={item.idMeal} className="slot-item">
                <img src={item.strMealThumb} alt="" />
                <span>{item.strMeal}</span>
                <button
                  className="remove"
                  onClick={() => onRemove(day, item.idMeal)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <button className="danger-btn" onClick={onClear}>
        🗑️ Clear Week
      </button>
    </section>
  );
}