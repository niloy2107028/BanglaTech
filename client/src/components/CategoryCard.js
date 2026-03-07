import React from "react";
import "./CategoryCard.css";

const CategoryCard = ({ category, productCount, onClick, image }) => {
  return (
    <div className="category-card" onClick={onClick}>
      <div className="category-card-image-wrapper">
        <img
          src={image}
          alt={category}
          className="category-card-image"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/80?text=No+Image";
          }}
        />
      </div>
      <h3 className="category-card-title">{category}</h3>
      <p className="category-card-count">{productCount} Products</p>
    </div>
  );
};

export default CategoryCard;
