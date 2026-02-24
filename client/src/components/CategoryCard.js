import React from "react";
import "./CategoryCard.css";

const CategoryCard = ({ category, productCount, onClick, icon }) => {
  return (
    <div className="category-card" onClick={onClick}>
      <div className="category-icon">{icon || "📦"}</div>
      <h3 className="category-name">{category}</h3>
      <p className="category-count">{productCount} Products</p>
    </div>
  );
};

export default CategoryCard;
