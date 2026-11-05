export default function RecipeCard({
  meal,
  isFavorite,
  onToggleFavorite,
  onClick,
  draggable = false,
}) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("application/json", JSON.stringify(meal));
  };

  return (
    <div className="recipe-wrap">
      <div
        className="recipe-card"
        draggable={draggable}
        onDragStart={draggable ? handleDragStart : undefined}
        onClick={() => onClick(meal.idMeal)}
      >
        <img src={meal.strMealThumb} alt={meal.strMeal} />
        <p>{meal.strMeal}</p>
      </div>

      {onToggleFavorite && (
        <button
          className="fav-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(meal);
          }}
          title="Toggle favorite"
        >
          {isFavorite ? "💔" : "❤️"}
        </button>
      )}
    </div>
  );
}