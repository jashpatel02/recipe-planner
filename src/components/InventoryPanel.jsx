import { useState } from "react";
import {
  filterByIngredient,
  getMealById,
  extractIngredients,
  PANTRY_STAPLES,
} from "../api";
import { INDIAN_STREET_FOOD } from "../data/indianStreetFood";

export default function InventoryPanel({ onCardClick }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSuggest = async () => {
    const userItems = input
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (userItems.length === 0) return;
    setLoading(true);
    setSearched(true);

    let apiResults = [];
    try {
      const first = await filterByIngredient(userItems[0]);
      const details = await Promise.all(
        first.slice(0, 20).map((m) => getMealById(m.idMeal))
      );
      apiResults = details.filter(Boolean);
    } catch (e) {
      console.error(e);
    }

    const allCandidates = [...INDIAN_STREET_FOOD, ...apiResults];

    const scored = allCandidates
      .map((meal) => {
        const ingredients = extractIngredients(meal);
        const names = ingredients.map((i) => i.name.toLowerCase());

        const matched = userItems.filter((ui) =>
          names.some((mi) => mi.includes(ui) || ui.includes(mi))
        ).length;

        const missingIngredients = ingredients.filter((ing) => {
          const name = ing.name.toLowerCase();
          const isProvided = userItems.some(
            (ui) => name.includes(ui) || ui.includes(name)
          );
          const isStaple = PANTRY_STAPLES.some(
            (s) => name.includes(s) || s.includes(name)
          );
          return !isProvided && !isStaple;
        });

        return {
          meal,
          matched,
          missing: missingIngredients.length,
          missingNames: missingIngredients.map((m) => m.name),
        };
      })
      .filter((s) => s.matched > 0 && s.missing <= 2)
      .sort((a, b) => {
        if (a.missing !== b.missing) return a.missing - b.missing;
        return b.matched - a.matched;
      })
      .slice(0, 12);

    setSuggestions(scored);
    setLoading(false);
  };

  return (
    <section className="panel inventory-panel">
      <h2>🧊 What Can I Make?</h2>
      <p className="hint">
        Enter ingredients separated by commas (e.g. milk, chocolate, cream).
        Basic pantry items (oil, salt, spices, butter, flour) are assumed available.
      </p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="milk, chocolate, cream"
        rows={2}
      />
      <button onClick={handleSuggest} disabled={loading || !input.trim()}>
        {loading ? "Analyzing..." : "Suggest Recipes"}
      </button>

      {searched && suggestions.length === 0 && !loading && (
        <p className="hint">
          No feasible recipes with ≤2 extra ingredients. Try adding more items.
        </p>
      )}

      <div className="recipe-grid small" style={{ marginTop: 12 }}>
        {suggestions.map(({ meal, matched, missing, missingNames }) => (
          <div
            key={meal.idMeal}
            className="recipe-card"
            onClick={() => onCardClick(meal.idMeal)}
          >
            <img src={meal.strMealThumb} alt={meal.strMeal} />
            <p>{meal.strMeal}</p>
            <span className="match-badge">
              {matched} matched ·{" "}
              {missing === 0
                ? "ready to cook!"
                : `need: ${missingNames.slice(0, 2).join(", ")}`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}