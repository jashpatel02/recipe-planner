import { useEffect, useState } from "react";
import { getRecipeById, extractIngredients } from "../api";

export default function RecipeModal({ mealId, onClose }) {
  const [meal, setMeal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getRecipeById(mealId).then((m) => !cancelled && setMeal(m));
    return () => {
      cancelled = true;
    };
  }, [mealId]);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        {!meal ? (
          <p>Loading...</p>
        ) : (
          <>
            <h2>{meal.strMeal}</h2>
            <img src={meal.strMealThumb} alt={meal.strMeal} />
            <p>
              <strong>Category:</strong> {meal.strCategory} |{" "}
              <strong>Area:</strong> {meal.strArea}
            </p>
            <h3>Ingredients</h3>
            <ul>
              {extractIngredients(meal).map((ing, i) => (
                <li key={i}>
                  {ing.measure ? `${ing.measure} ` : ""}
                  {ing.name}
                </li>
              ))}
            </ul>
            <h3>Instructions</h3>
            <p>{meal.strInstructions}</p>
            {meal.strYoutube && (
              <p>
                <a href={meal.strYoutube} target="_blank" rel="noreferrer">
                  ▶️ Watch video
                </a>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}