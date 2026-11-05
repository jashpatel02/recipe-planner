import { useState, useEffect } from "react";
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
  drinkToMealFormat 
} from "./api";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { signOut } from "firebase/auth";
import { auth } from "./firebase/config";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function AppInner() {
  const { user, isGuest, loading: authLoading, continueAsGuest } = useAuth();
  const { planner, savePlanner } = usePlanner();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useLocalStorage("favorites", []);
  const [selectedId, setSelectedId] = useState(null);
  
  // App states
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // If they're logged in or in guest mode, skip the welcome screen
  useEffect(() => {
    if (user || isGuest) setHasStarted(true);
  }, [user, isGuest]);

  const handleSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const combined = await searchEverything(q);
      setResults(combined);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCuisine = async (area) => {
    setLoading(true);
    try {
      const meals = await filterByArea(area);
      setResults(meals || []);
    } catch (err) {
      console.error("Could not fetch cuisine:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategory = async (cat) => {
    setLoading(true);
    try {
      const meals = await filterByCategory(cat);
      setResults(meals || []);
    } catch (err) {
      console.error("Could not fetch category:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fast drink fetch - we map right away instead of waiting for extra API calls
  const handleBeverage = async (type) => {
    setLoading(true);
    try {
      const drinks = await filterCocktailsByAlcoholic(type);
      if (!drinks || drinks.length === 0) {
        setResults([]);
        return;
      }
      
      const formatted = drinks.map(d => drinkToMealFormat({
        ...d,
        strAlcoholic: type,
        strInstructions: "Click to load full instructions and ingredients!",
      }));
      
      setResults(formatted);
    } catch (err) {
      console.error("Drink fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (meal) => {
    const exists = favorites.some(f => f.idMeal === meal.idMeal);
    if (exists) {
      setFavorites(favorites.filter(f => f.idMeal !== meal.idMeal));
    } else {
      setFavorites([...favorites, { 
        idMeal: meal.idMeal, 
        strMeal: meal.strMeal, 
        strMealThumb: meal.strMealThumb 
      }]);
    }
  };

  const addToPlanner = (day, meal) => {
    const full = favorites.find(f => f.idMeal === meal.idMeal) || meal;
    // Make sure it's not blank and not already there
    if (!full.strMeal || planner[day]?.some(m => m.idMeal === full.idMeal)) return;
    
    savePlanner({ ...planner, [day]: [...(planner[day] || []), full] });
  };

  const removeFromPlanner = (day, idMeal) => {
    savePlanner({ 
      ...planner, 
      [day]: planner[day].filter(m => m.idMeal !== idMeal) 
    });
  };

  const clearPlanner = () => {
    if (window.confirm("Are you sure you want to clear the whole week?")) {
      savePlanner(DAYS.reduce((acc, d) => ({ ...acc, [d]: [] }), {}));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Sign out error:", err.message);
    }
    localStorage.removeItem("planner");
    setHasStarted(false); 
  };

  if (authLoading) {
    return <div style={{ padding: 50, textAlign: "center", fontWeight: "bold" }}>Booting up the kitchen...</div>;
  }

  // --- LANDING PAGE ---
  if (!hasStarted) {
    return (
      <div className="welcome-screen">
        <div className="welcome-card">
          <h1>🍽️ Recipe Finder</h1>
          <p>Plan your week, build grocery lists, and find new dishes to cook.</p>
          
          <div className="welcome-actions">
            <button className="primary-btn" onClick={() => setShowAuth(true)}>
              Sign In / Create Account
            </button>
            <button className="secondary-btn" onClick={() => { 
              continueAsGuest(); 
              setHasStarted(true); 
            }}>
              Continue as Guest
            </button>
          </div>
        </div>
        
        {showAuth && (
          <AuthModal 
            onClose={() => setShowAuth(false)} 
            onLoginSuccess={() => setHasStarted(true)} 
          />
        )}
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="app">
      <header>
        <div className="header-top">
          <h1>🍽️ Meal Planner</h1>
          <div className="header-actions">
            <ThemeToggle />
            {isGuest && <span className="badge">Guest</span>}
            {user && !isGuest && (
              <>
                <button onClick={() => setShowHistory(true)}>My History</button>
                <button className="danger-btn" onClick={handleSignOut}>Sign Out</button>
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
          <h2>🔎 Search Results</h2>
          {loading ? (
            <p className="hint">Loading recipes...</p>
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