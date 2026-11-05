import { useState } from "react";
import { getRecipeById, extractIngredients } from "../api";

export default function ShoppingList({ planner }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setItems([]);

    // Get all unique meal IDs from the planner
    const ids = new Set();
    Object.values(planner).forEach(meals => meals.forEach(m => ids.add(m.idMeal)));

    if (ids.size === 0) {
      setItems([{ name: "Nothing planned yet. Drag some recipes into the week!", measures: "", isChecked: false }]);
      setLoading(false);
      return;
    }

    const bag = {}; // Using 'bag' instead of 'ingredientMap' feels more human

    for (const id of ids) {
      try {
        const meal = await getRecipeById(id);
        if (!meal) continue;
        
        extractIngredients(meal).forEach(({ name, measure }) => {
          const key = name.toLowerCase().trim();
          const cleanMeasure = (measure || "").toLowerCase();
          
          // Try to find a number at the start of the measure (e.g., "2 cups" -> 2)
          const numMatch = cleanMeasure.match(/^([\d.]+)/);
          
          if (!bag[key]) {
            bag[key] = { name, totalNumber: 0, unit: "", rawMeasures: new Set() };
          }

          if (numMatch && cleanMeasure.length > 1) {
            const num = parseFloat(numMatch[1]);
            const unit = cleanMeasure.replace(/^([\d.]+)/, "").trim();
            
            bag[key].totalNumber += num;
            // Keep the last unit we saw (imperfect, but works for most cases)
            if (unit) bag[key].unit = unit; 
          } else if (cleanMeasure) {
            bag[key].rawMeasures.add(measure.trim());
          }
        });
      } catch (err) {
        console.error("Skipping ingredient fetch for:", id, err);
      }
    }

    // Convert our bag into a list
    const finalList = Object.values(bag).map(it => {
      let finalMeasure = "";
      
      if (it.totalNumber > 0) {
        finalMeasure = `${it.totalNumber} ${it.unit}`.trim();
      } else if (it.rawMeasures.size > 0) {
        finalMeasure = Array.from(it.rawMeasures).join(", ");
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