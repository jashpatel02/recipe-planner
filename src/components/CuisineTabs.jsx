import { useState } from "react";

const CUISINES = ["Italian", "Mexican", "Indian", "Chinese", "Japanese", "Thai", "French"];
const CATEGORIES = ["Dessert", "Seafood", "Chicken", "Vegetarian", "Starter", "Side"];
const STREET_FOOD_SEARCHES = ["samosa", "chaat", "vada pav", "pav bhaji", "bhel puri", "pani puri", "aloo tikki"];
const BEVERAGE_TABS = [
  { label: "Cocktails", type: "Alcoholic" },
  { label: "Mocktails", type: "Non_Alcoholic" },
];

export default function CuisineTabs({
  onSelectCuisine,
  onSelectCategory,
  onSelectSearch,
  onSelectBeverage,
}) {
  const [activeTab, setActiveTab] = useState("");

  const handleSelect = (type, value, callback) => {
    setActiveTab(`${type}-${value}`);
    callback(value);
  };

  return (
    <div className="cuisine-tabs">
      <div className="tab-group">
        <span className="tab-label">Cuisines:</span>
        {CUISINES.map((c) => (
          <button 
            key={c} 
            className={activeTab === `cuisine-${c}` ? "active" : ""}
            onClick={() => handleSelect("cuisine", c, onSelectCuisine)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="tab-group">
        <span className="tab-label">Categories:</span>
        {CATEGORIES.map((c) => (
          <button 
            key={c}
            className={activeTab === `category-${c}` ? "active" : ""}
            onClick={() => handleSelect("category", c, onSelectCategory)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="tab-group">
        <span className="tab-label">Indian Street Food:</span>
        {STREET_FOOD_SEARCHES.map((s) => (
          <button 
            key={s}
            className={activeTab === `search-${s}` ? "active" : ""}
            onClick={() => handleSelect("search", s, onSelectSearch)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="tab-group">
        <span className="tab-label">Beverages:</span>
        {BEVERAGE_TABS.map((b) => (
          <button 
            key={b.type}
            className={activeTab === `beverage-${b.type}` ? "active" : ""}
            onClick={() => handleSelect("beverage", b.type, onSelectBeverage)}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}