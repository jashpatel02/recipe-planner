import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { usePlanner } from "./hooks/usePlanner";
import SearchBar from "./components/SearchBar";
import RecipeGrid from "./components/RecipeGrid";
import Favorites from "./components/Favorites";
import Planner from "./components/Planner";
import ShoppingList from "./components/ShoppingList";
import RecipeModal from "./components/RecipeModal";
import InventoryPanel from "./components/InventoryPanel";
import CuisineTabs from "./components/CuisineTabs";
import AuthModal from "./components/AuthModal";
import ThemeToggle from "./components/ThemeToggle";
import History from "./components/History";
import {
  searchEverything,
  filterByArea,
  filterByCategory,
  filterCocktailsByAlcoholic,
  getCocktailById,
  drinkToMealFormat,
} from "./api";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { signOut } from "firebase/auth";
import { auth } from "./firebase/config";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function AppInner() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const { planner, savePlanner } = usePlanner();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useLocalStorage("favorites", []);
  const [selectedId, setSelectedId] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const combined = await searchEverything(q);
      setResults(combined);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCuisine = async (area) => {
    setLoading(true);
    try {
      const meals = await filterByArea(area);
      setResults(meals); // Now using the instant list!
    } catch (e) {
      console.error("Cuisine fetch failed:", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategory = async (cat) => {
    setLoading(true);
    try {
      const meals = await filterByCategory(cat);
      setResults(meals); // Now using the instant list!
    } catch (e) {
      console.error("Category fetch failed:", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBeverage = async (type) => {
    setLoading(true);
    try {
      const drinks = await filterCocktailsByAlcoholic(type);
      setResults(drinks.map(drinkToMealFormat));
    } catch (e) {
      console.error("Beverage fetch failed:", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (meal) => {
    const exists = favorites.some((f) => f.idMeal === meal.idMeal);
    if (exists) {
      setFavorites(favorites.filter((f) => f.idMeal !== meal.idMeal));
    } else {
      setFavorites([
        ...favorites,
        { idMeal: meal.idMeal, strMeal: meal.strMeal, strMealThumb: meal.strMealThumb },
      ]);
    }
  };

  const addToPlanner = (day, meal) => {
    const full = favorites.find((f) => f.idMeal === meal.idMeal) || meal;
    if (!full.strMeal || planner[day]?.some((m) => m.idMeal === full.idMeal)) return;
    savePlanner({ ...planner, [day]: [...(planner[day] || []), full] });
  };

  const removeFromPlanner = (day, idMeal) => {
    savePlanner({ ...planner, [day]: planner[day].filter((m) => m.idMeal !== idMeal) });
  };

  const clearPlanner = () => {
    if (confirm("Clear the entire week?")) {
      savePlanner(DAYS.reduce((acc, d) => ({ ...acc, [d]: [] }), {}));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign-out failed:", e.message);
    }
    localStorage.removeItem("planner");
  };

  if (authLoading) return <p style={{ padding: 40 }}>Loading...</p>;

  return (
    <div className="app">
      <header>
        <div className="header-top">
          <h1>🍽️ Recipe Finder & Meal Planner</h1>
          <div className="header-actions">
            <ThemeToggle />
            {!user && !isGuest && (
              <button onClick={() => setShowAuth(true)}>Sign In</button>
            )}
            {isGuest && <span className="badge">Guest</span>}
            {user && !isGuest && (
              <>
                <button onClick={() => setShowHistory(true)}>History</button>
                <button className="danger-btn" onClick={handleSignOut}>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
        <SearchBar onSearch={handleSearch} />
        <CuisineTabs
          onSelectCuisine={handleCuisine}
          onSelectCategory={handleCategory}
          onSelectSearch={handleSearch}
          onSelectBeverage={handleBeverage}
        />
      </header>

      <main>
        <section className="panel">
          <h2>🔎 Results (drag any card to planner)</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <RecipeGrid
              meals={results}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onCardClick={setSelectedId}
              draggable
            />
          )}
        </section>

        <Favorites
          favorites={favorites}
          onCardClick={setSelectedId}
          onRemoveFavorite={toggleFavorite}
        />

        <Planner
          planner={planner}
          onDropMeal={addToPlanner}
          onRemove={removeFromPlanner}
          onClear={clearPlanner}
        />
      </main>

      <InventoryPanel onCardClick={setSelectedId} />
      <ShoppingList planner={planner} />

      {selectedId && (
        <RecipeModal mealId={selectedId} onClose={() => setSelectedId(null)} />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showHistory && <History onClose={() => setShowHistory(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}