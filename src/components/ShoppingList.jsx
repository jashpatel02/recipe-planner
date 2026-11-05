import { useState } from "react";
import { getRecipeById, extractIngredients } from "../api";

export default function ShoppingList({ planner }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setItems([]);

    // Get EVERY meal ID, including duplicates (e.g. Monday coffee, Tuesday coffee)
    const allIds = [];
    Object.values(planner).forEach((meals) => {
      meals.forEach((m) => allIds.push(m.idMeal));
    });

    if (allIds.length === 0) {
      setItems([{ name: "No meals planned yet.", measures: "", isChecked: false }]);
      setLoading(false);
      return;
    }

    const bag = {};

    // Fetch details for every single meal in the list
    for (const id of allIds) {
      try {
        const meal = await getRecipeById(id);
        if (!meal) continue;
        
        extractIngredients(meal).forEach(({ name, measure }) => {
          const key = name.toLowerCase().trim();
          const cleanMeasure = (measure || "").toLowerCase();
          
          // Look for a number at the start (e.g., "2 cups", "1.5 tbsp", "500g")
          const numMatch = cleanMeasure.match(/^([\d.]+)\s*(.*)/);
          
          if (!bag[key]) {
            bag[key] = { name, totalNumber: 0, unit: "", rawMeasures: new Set() };
          }

          if (numMatch) {
            const num = parseFloat(numMatch[1]);
            const unit = numMatch[2].trim();
            bag[key].totalNumber += num;
            if (unit) bag[key].unit = unit; // Save the latest unit
          } else if (cleanMeasure) {
            bag[key].rawMeasures.add(measure.trim());
          }
        });
      } catch (err) {
        console.error("Skipping ingredient fetch for:", id, err);
      }
    }

    // Convert bag into a readable list
    const finalList = Object.values(bag).map(it => {
      let finalMeasure = "";
      
      if (it.totalNumber > 0) {
        // Format nicely: e.g. "2 cups" or just "2" if no unit
        finalMeasure = `${it.totalNumber} ${it.unit}`.trim();
      } 
      
      // If there are random measures (like "a pinch"), add them too
      if (it.rawMeasures.size > 0) {
        const extras = Array.from(it.rawMeasures).join(", ");
        finalMeasure = finalMeasure ? `${finalMeasure} + ${extras}` : extras;
      }
      
      return {
        name: it.name,
        measures: finalMeasure,
        isChecked: false,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    setItems(finalList);
    setLoading(false);
  };

  const toggleItem = (idx) => {
    const newItems = [...items];
    newItems[idx].isChecked = !newItems[idx].isChecked;
    setItems(newItems);
  };

  const clearChecked = () => {
    setItems(items.filter(x => !x.isChecked));
  };

  const hasChecked = items.some(x => x.isChecked);

  return (
    <section className="shopping-section">
      <div className="shopping-header">
        <h2>🛒 Shopping List</h2>
        <div className="shopping-actions">
          <button onClick={generate} disabled={loading}>
            {loading ? "Building list..." : "Generate List"}
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
                readOnly
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