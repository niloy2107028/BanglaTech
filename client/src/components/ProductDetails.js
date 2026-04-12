import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCartPlus, faChevronLeft, faChevronRight, faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import ProductCard from "./ProductCard"; // For related products
import ReviewSection from "./ReviewSection";
import "./ProductDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data.data);
        
        // Fetch related products (same category)
        const relatedRes = await axios.get(`/api/products?categoryName=${response.data.data.categoryName}`);
        setRelatedProducts(relatedRes.data.data.filter(p => p._id !== id).slice(0, 4));
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Failed to load product details. It might not exist.");
        setLoading(false);
      }
    };

    fetchProductDetails();
    // Scroll to top when ID changes
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = () => {
    if (product && product.inStock) {
      // Logic for multi-quantity add to cart depends on CartContext implementation
      // Currently, most basic CartContexts handle one at a time, but if it supports quantity:
      // addToCart(product._id, quantity); 
      // For now, let's stick to the current implementation but call it 'quantity' times if needed
      // OR better: assume cart context can be updated later to handle quantity.
      for(let i = 0; i < quantity; i++) {
        addToCart(product._id);
      }
      alert(`Added ${quantity} ${product.name} to cart!`);
    }
  };

  const incrementQty = () => {
    if (quantity < (product?.stock || 1)) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="loading-details">
        <div className="spinner-details"></div>
        <p>Loading premium product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-container">
        <div className="error-message">
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/")} className="btn-primary">Go Back Home</button>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="product-details-container">
      {/* Breadcrumb */}
      <nav className="product-details-breadcrumb">
        <span className="breadcrumb-item" onClick={() => navigate("/")}>Home</span>
        <FontAwesomeIcon icon={faChevronRight} className="star-icon" />
        <span className="breadcrumb-item" onClick={() => navigate(`/category/${product.categoryName}`)}>
          {product.categoryName}
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="star-icon" />
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      <div className="product-details-main">
        {/* Left: Image Section */}
        <div className="product-details-image-section">
          <div className="product-details-image-wrapper">
            <img src={product.image} alt={product.name} className="product-main-image" />
          </div>
        </div>

        {/* Right: Info Section */}
        <div className="product-info-section">
          <div className="product-details-brand">{product.brand}</div>
          <h1 className="product-details-title">{product.name}</h1>
          
          <div className="product-details-rating">
            <div className="stars-container">
              {[...Array(5)].map((_, index) => (
                <FontAwesomeIcon
                  key={index}
                  icon={faStar}
                  className={`star-icon ${index < Math.floor(product.rating) ? "star-filled" : "star-empty"}`}
                />
              ))}
            </div>
            <span className="review-count">({product.reviews} customer reviews)</span>
          </div>

          <div className="product-details-price-card">
            <div className="price-main">
              ৳{product.price.toLocaleString()}
              {discount > 0 && (
                <>
                  <span className="original-price-strikethrough">৳{product.originalPrice.toLocaleString()}</span>
                  <span className="discount-tag">-{discount}% OFF</span>
                </>
              )}
            </div>
            
            <div className={`stock-status ${product.inStock ? "stock-in" : "stock-out"}`}>
              {product.inStock ? `Available (${product.stock} items left)` : "Currently Unavailable"}
            </div>
          </div>

          <div className="product-details-description">
            <h3 className="section-title">Product Description</h3>
            <p className="description-content">{product.description}</p>
          </div>

          {/* Specifications if available */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="product-details-specs">
              <h3 className="section-title">Key Specifications</h3>
              <div className="specifications-grid">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="spec-row">
                    <div className="spec-label">{key}</div>
                    <div className="spec-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="purchase-actions">
            {product.inStock && (
              <div className="quantity-selector">
                <button className="qty-btn" onClick={decrementQty}>
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <div className="qty-value">{quantity}</div>
                <button className="qty-btn" onClick={incrementQty}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            )}
            
            <button 
              className="add-to-cart-big-btn" 
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <FontAwesomeIcon icon={faCartPlus} />
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </button>
          </div>

          <div className="seller-section">
            <div className="seller-avatar">
              {(product.seller?.name || "B")[0].toUpperCase()}
            </div>
            <div className="seller-info">
              <h4>Sold by {product.seller?.name || "BanglaMart Official"}</h4>
              <p>Trusted Seller | Quick Delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review & Rating Section */}
      <ReviewSection 
        productId={product._id} 
        productSellerId={typeof product.seller === 'object' ? product.seller._id : product.seller} 
      />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2>Related Products</h2>
          <div className="productList-view-products-grid">
            {relatedProducts.map(relProduct => (
              <ProductCard 
                key={relProduct._id} 
                product={relProduct} 
                onView={(p) => navigate(`/product/${p._id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
