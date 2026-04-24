import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCartPlus,
  faChevronLeft,
  faChevronRight,
  faMinus,
  faPlus,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { trackLocalProductSignal } from "../utils/localRecommendation";
import ProductCard from "./ProductCard"; // For related products
import ReviewSection from "./ReviewSection";
import QnASection from "./QnASection";
import "./ProductDetails.css";

const MIN_DWELL_TRACK_MS = 5000;
const VIEWER_PING_INTERVAL_MS = 5000;
const VIEWER_SESSION_KEY = "bt_live_viewer_token";

function getViewerToken() {
  if (typeof window === "undefined") return "";

  const existing = String(window.sessionStorage.getItem(VIEWER_SESSION_KEY) || "").trim();
  if (existing) return existing;

  let nextToken = "";
  if (typeof window.crypto !== "undefined" && typeof window.crypto.randomUUID === "function") {
    nextToken = window.crypto.randomUUID();
  } else {
    nextToken = `viewer_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  window.sessionStorage.setItem(VIEWER_SESSION_KEY, nextToken);
  return nextToken;
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { formatCurrency, formatNumber } = useLanguage();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [liveViewerCount, setLiveViewerCount] = useState(0);
  const [canScrollRelatedLeft, setCanScrollRelatedLeft] = useState(false);
  const [canScrollRelatedRight, setCanScrollRelatedRight] = useState(false);
  const viewStartMsRef = useRef(0);
  const dwellSentRef = useRef(false);
  const relatedScrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAllCategoryProducts = async (categoryName) => {
      const normalizedCategoryName = String(categoryName || "").trim();
      if (!normalizedCategoryName) return [];

      const encodedCategory = encodeURIComponent(normalizedCategoryName);
      const firstResponse = await axios.get(
        `/api/products?categoryName=${encodedCategory}&page=1`,
      );

      let allProducts = Array.isArray(firstResponse.data?.data)
        ? [...firstResponse.data.data]
        : [];
      const totalPages = Math.max(Number(firstResponse.data?.pages || 1), 1);

      if (totalPages <= 1) return allProducts;

      const pageRequests = [];
      for (let page = 2; page <= totalPages; page += 1) {
        pageRequests.push(
          axios.get(`/api/products?categoryName=${encodedCategory}&page=${page}`),
        );
      }

      const pageResponses = await Promise.all(pageRequests);
      pageResponses.forEach((pageResponse) => {
        if (Array.isArray(pageResponse.data?.data)) {
          allProducts = allProducts.concat(pageResponse.data.data);
        }
      });

      return allProducts;
    };

    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/products/${id}`);
        if (cancelled) return;

        const currentProduct = response.data?.data || null;
        setProduct(currentProduct);

        const relatedCandidates = await fetchAllCategoryProducts(
          currentProduct?.categoryName,
        );
        if (cancelled) return;

        const seen = new Set();
        const filteredRelatedProducts = [];
        relatedCandidates.forEach((item) => {
          const productId = String(item?._id || "");
          if (!productId || productId === String(id) || seen.has(productId)) return;
          seen.add(productId);
          filteredRelatedProducts.push(item);
        });

        setRelatedProducts(filteredRelatedProducts);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching product details:", err);
        setError("Failed to load product details. It might not exist.");
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProductDetails();
    // Scroll to top when ID changes
    window.scrollTo(0, 0);

    return () => {
      cancelled = true;
    };
  }, [id]);

  const sendDwellSignal = useCallback((reason) => {
    if (!isAuthenticated || !product?._id || dwellSentRef.current) return;

    const startedAt = Number(viewStartMsRef.current || 0);
    if (!startedAt) return;

    const dwellMs = Math.max(0, Date.now() - startedAt);
    if (dwellMs < MIN_DWELL_TRACK_MS) return;

    dwellSentRef.current = true;

    const endpoint = `/api/products/${product._id}/track-dwell`;
    const payload = { dwellMs, reason };

    let sentByBeacon = false;
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      try {
        const blob = new Blob([JSON.stringify(payload)], {
          type: "application/json",
        });
        sentByBeacon = navigator.sendBeacon(endpoint, blob);
      } catch (error) {
        sentByBeacon = false;
      }
    }

    if (!sentByBeacon) {
      axios
        .post(endpoint, payload, { withCredentials: true })
        .catch(() => {
          // Keep product browsing smooth even if dwell tracking fails.
        });
    }
  }, [isAuthenticated, product?._id]);

  useEffect(() => {
    if (!product?._id) return;

    trackLocalProductSignal(product);

    if (!isAuthenticated) return;

    viewStartMsRef.current = Date.now();
    dwellSentRef.current = false;

    axios
      .post(`/api/products/${product._id}/track-click`, {}, { withCredentials: true })
      .catch(() => {
        // Keep product browsing smooth even if click tracking fails.
      });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendDwellSignal("visibility_hidden");
      }
    };

    const handlePageHide = () => {
      sendDwellSignal("page_hide");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      sendDwellSignal("unmount");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isAuthenticated, product, sendDwellSignal]);

  useEffect(() => {
    if (!product?._id) return () => {};

    const viewerToken = getViewerToken();
    let cancelled = false;
    let intervalId = null;

    const pingLiveViewer = async () => {
      try {
        const response = await axios.post(
          `/api/products/${product._id}/viewers/ping`,
          { viewerToken },
          { withCredentials: true },
        );

        if (cancelled) return;

        const viewingNow = Number(response.data?.data?.viewingNow || 0);
        setLiveViewerCount(Math.max(0, viewingNow));
      } catch (error) {
        if (!cancelled) {
          // Keep product browsing smooth even if live-view ping fails.
        }
      }
    };

    const leaveLiveViewer = () => {
      const endpoint = `/api/products/${product._id}/viewers/leave`;
      const payload = { viewerToken };

      if (
        typeof navigator !== "undefined"
        && typeof navigator.sendBeacon === "function"
      ) {
        try {
          const blob = new Blob([JSON.stringify(payload)], {
            type: "application/json",
          });
          const sent = navigator.sendBeacon(endpoint, blob);
          if (sent) return;
        } catch (error) {
          // fallback below
        }
      }

      axios.post(endpoint, payload, { withCredentials: true }).catch(() => {
        // Keep page unload smooth if leave tracking fails.
      });
    };

    pingLiveViewer();
    intervalId = window.setInterval(pingLiveViewer, VIEWER_PING_INTERVAL_MS);

    const onPageHide = () => {
      leaveLiveViewer();
    };

    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener("pagehide", onPageHide);
      leaveLiveViewer();
    };
  }, [product?._id]);

  useEffect(() => {
    const track = relatedScrollRef.current;
    if (!track || relatedProducts.length === 0) {
      setCanScrollRelatedLeft(false);
      setCanScrollRelatedRight(false);
      return () => {};
    }

    const updateScrollState = () => {
      const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth);
      setCanScrollRelatedLeft(track.scrollLeft > 8);
      setCanScrollRelatedRight(track.scrollLeft < maxLeft - 8);
    };

    updateScrollState();
    track.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [relatedProducts]);

  const scrollRelatedProducts = (direction) => {
    const track = relatedScrollRef.current;
    if (!track) return;

    const amount = Math.max(260, Math.round(track.clientWidth * 0.82));
    track.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const handleAddToCart = async () => {
    if (product && product.inStock) {
      const added = await addToCart(product._id, quantity);
      if (added) {
        alert(`Added ${quantity} ${product.name} to cart!`);
      }
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
  const liveViewerText = liveViewerCount === 1
    ? "1 person is viewing this product right now"
    : `${formatNumber(liveViewerCount)} people are viewing this product right now`;

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
                  className={`star-icon ${index < Math.floor(product.rating || 0) ? "star-filled" : "star-empty"}`}
                />
              ))}
            </div>
            <span className="review-count">({formatNumber(product.reviews)} customer reviews)</span>
          </div>

          <div className="product-live-proof" aria-live="polite">
            <span className="live-proof-dot" />
            <FontAwesomeIcon icon={faEye} className="live-proof-icon" />
            <span className="live-proof-text">{liveViewerText}</span>
          </div>

          <div className="product-details-price-card">
            <div className="price-main">
              {formatCurrency(product.price)}
              {discount > 0 && (
                <>
                  <span className="original-price-strikethrough">{formatCurrency(product.originalPrice)}</span>
                  <span className="discount-tag">-{discount}% OFF</span>
                </>
              )}
            </div>
            
            <div className={`stock-status ${product.inStock ? "stock-in" : "stock-out"}`}>
              {product.inStock ? `Available (${formatNumber(product.stock)} items left)` : "Currently Unavailable"}
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

      <QnASection
        productId={product._id}
        productSellerId={typeof product.seller === "object" ? product.seller._id : product.seller}
      />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <div className="related-products-head">
            <h2>Related Products</h2>
            <div className="related-scroll-actions">
              <button
                type="button"
                className="related-scroll-btn"
                onClick={() => scrollRelatedProducts("left")}
                disabled={!canScrollRelatedLeft}
                aria-label="Scroll related products left"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                type="button"
                className="related-scroll-btn"
                onClick={() => scrollRelatedProducts("right")}
                disabled={!canScrollRelatedRight}
                aria-label="Scroll related products right"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>

          <div className="related-products-track" ref={relatedScrollRef}>
            {relatedProducts.map(relProduct => (
              <div className="related-product-card" key={relProduct._id}>
                <ProductCard
                  product={relProduct}
                  onView={(p) => navigate(`/product/${p._id}`)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
