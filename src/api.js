const MEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";
const COCKTAILDB_BASE = "https://www.thecocktaildb.com/api/json/v1/1";

import { INDIAN_STREET_FOOD } from "./data/indianStreetFood";

// Hardcoded fallbacks because TheMealDB API randomly drops Indian & French
const FALLBACK_IDS = {
  Indian: [
    "52785", "52819", "52821", "52822", "52823", "52824", "52825", "52826",
    "52827", "52828", "52829", "52830", "52831", "52832", "52833", "52834"
  ],
  French: [
    "52926", "52927", "52928", "52929", "52930", "52931", "52932", "52933",
    "52934", "52935", "52936", "52937", "52938", "52939", "52940", "52941"
  ]
};

// ---------------- TheMealDB ----------------
export async function searchRecipes(query) {
  const res = await fetch(`${MEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.meals || [];
}

export async function filterByArea(area) {
  const res = await fetch(`${MEALDB_BASE}/filter.php?a=${encodeURIComponent(area)}`);
  const data = await res.json();
  
  // If API fails (returns null), use our hardcoded IDs
  if (!data.meals && FALLBACK_IDS[area]) {
    const promises = FALLBACK_IDS[area].map(id => getMealById(id));
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }
  
  return data.meals || [];
}

export async function filterByCategory(category) {
  const res = await fetch(`${MEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`);
  const data = await res.json();
  return data.meals || [];
}

export async function filterByIngredient(ingredient) {
  const res = await fetch(`${MEALDB_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
  const data = await res.json();
  return data.meals || [];
}

export async function getMealById(id) {
  const res = await fetch(`${MEALDB_BASE}/lookup.php?i=${id}`);
  const data = await res.json();
  return data.meals ? data.meals[0] : null;
}

// ---------------- TheCocktailDB ----------------
export async function searchCocktails(query) {
  const res = await fetch(`${COCKTAILDB_BASE}/search.php?s=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.drinks || [];
}

export async function filterCocktailsByAlcoholic(type) {
  const res = await fetch(`${COCKTAILDB_BASE}/filter.php?a=${type}`);
  const data = await res.json();
  return data.drinks || [];
}

export async function getCocktailById(id) {
  const res = await fetch(`${COCKTAILDB_BASE}/lookup.php?i=${id}`);
  const data = await res.json();
  return data.drinks ? data.drinks[0] : null;
}

export function drinkToMealFormat(drink) {
  const ingredients = [];
  for (let i = 1; i <= 15; i++) {
    const ing = drink[`strIngredient${i}`];
    const meas = drink[`strMeasure${i}`];
    if (ing && ing.trim()) {
      ingredients.push({ name: ing.trim(), measure: (meas || "").trim() });
    }
  }
  return {
    idMeal: `drink_${drink.idDrink}`,
    strMeal: drink.strDrink,
    strMealThumb: drink.strDrinkThumb,
    strCategory: drink.strCategory || "Drink",
    strArea: drink.strAlcoholic || "Beverage",
    strInstructions: drink.strInstructions,
    strYoutube: "",
    _isDrink: true,
    _ingredients: ingredients,
  };
}

// ---------------- Local Indian Street Food ----------------
export function getIndianStreetFoodById(id) {
  return INDIAN_STREET_FOOD.find((m) => m.idMeal === id) || null;
}

export function searchIndianStreetFood(query) {
  const q = query.toLowerCase();
  return INDIAN_STREET_FOOD.filter(
    (m) =>
      m.strMeal.toLowerCase().includes(q) ||
      m.strInstructions.toLowerCase().includes(q)
  );
}

// ---------------- Ingredient keyword search ----------------
export async function searchByIngredientKeyword(ingredient) {
  try {
    const res = await fetch(`${MEALDB_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
    const data = await res.json();
    return data.meals || [];
  } catch {
    return [];
  }
}

export async function searchEverything(query) {
  const q = query.trim();
  if (!q) return [];

  const [byName, byIngredient, drinks, local] = await Promise.all([
    searchRecipes(q).catch(() => []),
    searchByIngredientKeyword(q).catch(() => []),
    searchCocktails(q).catch(() => []),
    Promise.resolve(searchIndianStreetFood(q)),
  ]);

  const merged = new Map();
  [
    ...local,
    ...byName,
    ...drinks.map(drinkToMealFormat),
    ...byIngredient,
  ].forEach((m) => {
    if (m && m.idMeal && !merged.has(m.idMeal)) merged.set(m.idMeal, m);
  });

  return Array.from(merged.values());
}

export function extractIngredients(meal) {
  if (meal._isDrink && meal._ingredients) return meal._ingredients;
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const meas = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      list.push({ name: ing.trim(), measure: (meas || "").trim() });
    }
  }
  return list;
}

export async function getRecipeById(id) {
  const local = getIndianStreetFoodById(id);
  if (local) return local;

  if (id.startsWith("drink_")) {
    const drinkId = id.replace("drink_", "");
    const drink = await getCocktailById(drinkId);
    return drink ? drinkToMealFormat(drink) : null;
  }

  return getMealById(id);
}

export const PANTRY_STAPLES = [
  "salt", "pepper", "oil", "butter", "sugar", "flour", "water",
  "garlic", "onion", "cumin", "turmeric", "chili powder", "garam masala",
  "coriander", "ginger", "baking powder", "baking soda", "vanilla",
  "milk", "cream", "egg", "bread", "rice", "pasta", "yogurt",
];