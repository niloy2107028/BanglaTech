import React from "react";
import "./CategoryCard.css";

const CategoryCard = ({ category, productCount, onClick }) => {
  // Category icons mapping
  const categoryIcons = {
    Electronics: "💻",
    Fashion: "👕",
    "Home & Living": "🏠",
    "Beauty & Health": "💄",
    "Sports & Outdoors": "⚽",
    "Books & Stationery": "📚",
    "Toys & Games": "🎮",
    Automotive: "🚗",
    "Food & Groceries": "🛒",
    "Mobile & Accessories": "📱",
  };

  return (
    <div className="category-card" onClick={onClick}>
      <div className="category-icon">{categoryIcons[category] || "📦"}</div>
      <h3 className="category-name">{category}</h3>
      <p className="category-count">{productCount} Products</p>
    </div>
  );
};

export default CategoryCard;
