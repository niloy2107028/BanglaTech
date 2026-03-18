import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCartPlus } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "./ProductCard.css";

const ProductCard = ({ product, onDelete, onEdit, onView }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  return (
    <div className="product-card">
      {/* Discount Badge */}
      {discount > 0 && (
        <div className="product-discount-badge">-{discount}%</div>
      )}

      {/* Product Image */}
      <div className="product-image-wrapper" onClick={() => onView(product)}>
        <img src={product.image} alt={product.name} className="product-image" />
        {!product.inStock && (
          <div className="product-out-of-stock-overlay">Out of Stock</div>
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
          <div className="product-stars">
            {[...Array(5)].map((_, index) => (
              <FontAwesomeIcon
                key={index}
                icon={faStar}
                className={`product-star ${
                  index < Math.floor(product.rating)
                    ? "product-star-filled"
                    : "product-star-empty"
                }`}
              />
            ))}
          </div>
          <span className="product-rating-text">
            {product.rating} ({product.reviews} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="product-price-wrapper">
          <div className="product-price">৳{product.price.toLocaleString()}</div>
          {product.originalPrice && (
            <div className="product-original-price">
              ৳{product.originalPrice.toLocaleString()}
            </div>
          )}
          <div className="product-seller-info" style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
            Seller: <span style={{ fontWeight: '600', color: '#111827' }}>{product.seller?.name || 'BanglaMart'}</span>
          </div>
        </div>

        {/* Stock Status */}
        <div
          className={`product-stock-badge ${
            product.inStock ? "product-stock-in" : "product-stock-out"
          }`}
        >
          {product.inStock ? `${product.stock} in stock` : "Out of stock"}
        </div>

        {/* Action Buttons */}
        <div className="product-actions">
          <button
            className="product-action-btn product-action-btn-view"
            onClick={() => onView(product)}
            title="View Details"
          >
            View
          </button>
          {/* Only show Add to Cart for Buyers or Guests */}
          {(!user || user.role === "buyer") && (
            <button
              className="product-action-btn product-action-btn-cart"
              onClick={() => addToCart(product._id)}
              disabled={!product.inStock}
              title="Add to Cart"
            >
              <FontAwesomeIcon icon={faCartPlus} />
            </button>
          )}
          {onEdit && (
            <button
              className="product-action-btn product-action-btn-edit"
              onClick={() => onEdit(product)}
              title="Edit Product"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              className="product-action-btn product-action-btn-delete"
              onClick={() => onDelete(product._id)}
              title="Delete Product"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
