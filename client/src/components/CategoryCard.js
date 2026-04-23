import React from 'react';
import './CategoryCard.css';

const CategoryCard = ({ category, onClick, image }) => {
  return (
    <div className="category-card" onClick={onClick}>
      <div className="category-card-image-wrapper">
        <img
          src={image}
          alt={category}
          className="category-card-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/no-image.png';
          }}
        />
      </div>
      <h3 className="category-card-title">{category}</h3>
    </div>
  );
};

export default CategoryCard;
