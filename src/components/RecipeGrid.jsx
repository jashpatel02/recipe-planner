import RecipeCard from "./RecipeCard";

export default function RecipeGrid({
  meals,
  favorites = [],
  onToggleFavorite,
  onCardClick,
  draggable = false,
}) {
  if (meals.length === 0) {
    return <p className="hint">No recipes yet. Try searching above!</p>;
  }

  const isFav = (id) => favorites.some((f) => f.idMeal === id);

  return (
    <div className="recipe-grid">
      {meals.map((meal) => (
        <RecipeCard
          key={meal.idMeal}
          meal={meal}
          isFavorite={isFav(meal.idMeal)}
          onToggleFavorite={onToggleFavorite}
          onClick={onCardClick}
          draggable={draggable}
        />
      ))}
    </div>
  );
}