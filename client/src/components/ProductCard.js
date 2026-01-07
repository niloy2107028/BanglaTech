import React from "react";
import { FaStar, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import "./ProductCard.css";

const ProductCard = ({ product, onDelete, onEdit, onView }) => {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <div className="product-card">
      {/* Discount Badge */}
      {discount > 0 && <div className="discount-badge">-{discount}%</div>}

      {/* Product Image */}
      <div className="product-image" onClick={() => onView(product)}>
        <img src={product.image} alt={product.name} />
        {!product.inStock && (
          <div className="out-of-stock-overlay">Out of Stock</div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info">
        <div className="product-brand">{product.brand}</div>
        <h3 className="product-name" onClick={() => onView(product)}>
          {product.name}
        </h3>

        {/* Rating */}
        <div className="product-rating">
          <div className="stars">
            {[...Array(5)].map((_, index) => (
              <FaStar
                key={index}
                className={
                  index < Math.floor(product.rating)
                    ? "star-filled"
                    : "star-empty"
                }
              />
            ))}
          </div>
          <span className="rating-text">
            {product.rating} ({product.reviews} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="product-price">
          <div className="current-price">৳{product.price.toLocaleString()}</div>
          {product.originalPrice && (
            <div className="original-price">
              ৳{product.originalPrice.toLocaleString()}
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div
          className={`stock-status ${
            product.inStock ? "in-stock" : "out-of-stock"
          }`}
        >
          {product.inStock ? `${product.stock} in stock` : "Out of stock"}
        </div>

        {/* Action Buttons */}
        <div className="product-actions">
          <button
            className="action-btn view-btn"
            onClick={() => onView(product)}
            title="View Details"
          >
            <FaEye /> View
          </button>
          <button
            className="action-btn edit-btn"
            onClick={() => onEdit(product)}
            title="Edit Product"
          >
            <FaEdit /> Edit
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => onDelete(product._id)}
            title="Delete Product"
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
