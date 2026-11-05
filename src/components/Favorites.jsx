import RecipeCard from "./RecipeCard";

export default function Favorites({
  favorites,
  onCardClick,
  onRemoveFavorite,
}) {
  return (
    <section className="panel">
      <h2>❤️ Favorites (drag to planner)</h2>
      {favorites.length === 0 ? (
        <p className="hint">No favorites yet. Search and click ❤️</p>
      ) : (
        <div className="recipe-grid small">
          {favorites.map((meal) => (
            <div key={meal.idMeal} className="recipe-wrap">
              <RecipeCard
                meal={meal}
                onClick={onCardClick}
                draggable
              />
              <button
                className="fav-remove"
                title="Remove from favorites"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFavorite(meal);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}