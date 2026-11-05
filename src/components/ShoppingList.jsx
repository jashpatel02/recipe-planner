import { useState } from "react";
import { getRecipeById, extractIngredients } from "../api";

export default function ShoppingList({ planner }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setItems([]);

    const ids = new Set();
    Object.values(planner).forEach((meals) =>
      meals.forEach((m) => ids.add(m.idMeal))
    );

    if (ids.size === 0) {
      setItems([
        { name: "No meals planned yet. Drag recipes into the planner first!", measures: "", isChecked: false },
      ]);
      setLoading(false);
      return;
    }

    const map = {};

    for (const id of ids) {
      try {
        const meal = await getRecipeById(id);
        if (!meal) continue;
        extractIngredients(meal).forEach(({ name, measure }) => {
          const key = name.toLowerCase();
          if (!map[key]) map[key] = { name, measures: new Set() };
          if (measure) map[key].measures.add(measure);
        });
      } catch (err) {
        console.error(err);
      }
    }

    const list = Object.values(map).map((it) => ({
      name: it.name,
      measures: Array.from(it.measures).join(", "),
      isChecked: false, // Initialize as unchecked
    }));
    setItems(list);
    setLoading(false);
  };

  const toggleItem = (index) => {
    const newItems = [...items];
    newItems[index].isChecked = !newItems[index].isChecked;
    setItems(newItems);
  };

  const clearChecked = () => {
    setItems(items.filter((item) => !item.isChecked));
  };

  const hasChecked = items.some((item) => item.isChecked);

  return (
    <section className="shopping-section">
      <div className="shopping-header">
        <h2>🛒 Shopping List</h2>
        <div className="shopping-actions">
          <button onClick={generate} disabled={loading}>
            {loading ? "Generating..." : "Generate List"}
          </button>
          {hasChecked && (
            <button className="danger-btn" onClick={clearChecked}>
              Clear Checked
            </button>
          )}
        </div>
      </div>

      <ul id="shoppingList">
        {items.map((it, idx) => (
          <li
            key={idx}
            className={it.isChecked ? "checked" : ""}
            onClick={() => toggleItem(idx)}
          >
            <label>
              <input
                type="checkbox"
                checked={it.isChecked}
                onChange={() => {}} // Handled by the li onClick
              />
              <span>
                {it.measures ? `${it.name} — ${it.measures}` : it.name}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}