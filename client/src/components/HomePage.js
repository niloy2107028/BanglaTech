import React, { useEffect, useRef, useState } from "react";
import axios from "../api";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

import ProductCard from "./ProductCard";
import ProductList from "./ProductList";
import "./HomePage.css";

function dedupeProducts(products = []) {
  const seen = new Set();
  const output = [];

  for (const product of products) {
    const key = String(product?._id || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(product);
  }

  return output;
}

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendationsPersonalized, setRecommendationsPersonalized] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canScrollCategoriesLeft, setCanScrollCategoriesLeft] = useState(false);
  const [canScrollCategoriesRight, setCanScrollCategoriesRight] = useState(false);
  const [canScrollRecommendedLeft, setCanScrollRecommendedLeft] = useState(false);
  const [canScrollRecommendedRight, setCanScrollRecommendedRight] = useState(false);

  const navigate = useNavigate();
  const categoryStripRef = useRef(null);
  const recommendedStripRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const { t, translateCategoryName } = useLanguage();

  useEffect(() => {
    const loadHomePage = async () => {
      setLoading(true);
      try {
        const [loadedCategories, featuredProducts] = await Promise.all([
          fetchCategories(),
          fetchFeaturedProducts(),
        ]);
        await fetchRecommendedProducts();
        if (!Array.isArray(loadedCategories)) {
          setCategories([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadHomePage();
  }, [isAuthenticated]);

  useEffect(() => {
    const strip = categoryStripRef.current;
    if (!strip) {
      setCanScrollCategoriesLeft(false);
      setCanScrollCategoriesRight(false);
      return () => {};
    }

    const updateScrollControls = () => {
      const maxLeft = Math.max(0, strip.scrollWidth - strip.clientWidth);
      setCanScrollCategoriesLeft(strip.scrollLeft > 8);
      setCanScrollCategoriesRight(strip.scrollLeft < maxLeft - 8);
    };

    updateScrollControls();
    strip.addEventListener("scroll", updateScrollControls);
    window.addEventListener("resize", updateScrollControls);

    return () => {
      strip.removeEventListener("scroll", updateScrollControls);
      window.removeEventListener("resize", updateScrollControls);
    };
  }, [categories]);

  useEffect(() => {
    const strip = recommendedStripRef.current;
    if (!strip || recommendedProducts.length === 0) {
      setCanScrollRecommendedLeft(false);
      setCanScrollRecommendedRight(false);
      return () => {};
    }

    const updateScrollControls = () => {
      const maxLeft = Math.max(0, strip.scrollWidth - strip.clientWidth);
      setCanScrollRecommendedLeft(strip.scrollLeft > 8);
      setCanScrollRecommendedRight(strip.scrollLeft < maxLeft - 8);
    };

    updateScrollControls();
    strip.addEventListener("scroll", updateScrollControls);
    window.addEventListener("resize", updateScrollControls);

    return () => {
      strip.removeEventListener("scroll", updateScrollControls);
      window.removeEventListener("resize", updateScrollControls);
    };
  }, [recommendedProducts]);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get("/api/products?featured=true");
      const featuredProducts = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setProducts(featuredProducts);
      return featuredProducts;
    } catch (error) {
      console.error("Error fetching featured products:", error);
      setProducts([]);
      return [];
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories");
      const nextCategories = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setCategories(nextCategories);
      return nextCategories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      return [];
    }
  };

  const fetchRecommendedProducts = async () => {
    if (!isAuthenticated) {
      setRecommendedProducts([]);
      setRecommendationsPersonalized(false);
      return;
    }

    try {
      const response = await axios.get("/api/products/recommendations?limit=18", {
        withCredentials: true,
      });
      const personalizedProducts = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setRecommendedProducts(dedupeProducts(personalizedProducts).slice(0, 18));
      setRecommendationsPersonalized(Boolean(response.data?.personalized));
    } catch (error) {
      console.error("Error fetching recommended products:", error);
      setRecommendedProducts([]);
      setRecommendationsPersonalized(false);
    }
  };

  const handleViewCategory = (category) => {
    const categoryName = String(category?.name || "").trim();
    if (!categoryName) return;
    navigate(`/category/${encodeURIComponent(categoryName)}`);
  };

  const scrollCategories = (direction) => {
    const strip = categoryStripRef.current;
    if (!strip) return;

    const amount = Math.max(220, Math.round(strip.clientWidth * 0.8));
    strip.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const scrollRecommended = (direction) => {
    const strip = recommendedStripRef.current;
    if (!strip) return;

    const amount = Math.max(300, Math.round(strip.clientWidth * 0.86));
    strip.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="homepage-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="homepage">
      <div className="homepage-container">
        <section className="homepage-hero">
          <div className="homepage-hero-copy">
            <span className="homepage-hero-badge">{t("home.heroBadge")}</span>
            <h1>{t("home.heroTitle")}</h1>
            <p>{t("home.heroDescription")}</p>
            <div className="homepage-hero-actions">
              <button
                onClick={() => navigate("/search")}
                className="homepage-primary-btn"
              >
                {t("home.exploreProducts")}
              </button>
              <button
                onClick={() => navigate("/category/Electronics")}
                className="homepage-secondary-btn"
              >
                {t("home.browseElectronics")}
              </button>
            </div>
          </div>
          <div className="homepage-hero-stats">
            <div className="hero-stat-card">
              <strong>{categories.length}+</strong>
              <span>{t("home.popularCategories")}</span>
            </div>
            <div className="hero-stat-card">
              <strong>{products.length}+</strong>
              <span>{t("home.featuredPicks")}</span>
            </div>
            <div className="hero-stat-card">
              <strong>Fast</strong>
              <span>{t("home.fastFlow")}</span>
            </div>
          </div>
        </section>

        <section className="category-strip-section">
          <div className="category-strip-head">
            <div>
              <h2>{t("home.shopByCategory")}</h2>
              <p>{t("home.shopByCategoryDesc")}</p>
            </div>
            <div className="category-strip-controls">
              <button
                type="button"
                className="category-strip-btn"
                onClick={() => scrollCategories("left")}
                disabled={!canScrollCategoriesLeft}
                aria-label="Scroll categories left"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                type="button"
                className="category-strip-btn"
                onClick={() => scrollCategories("right")}
                disabled={!canScrollCategoriesRight}
                aria-label="Scroll categories right"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>

          <div className="category-strip-track" ref={categoryStripRef}>
            <button
              type="button"
              className="category-strip-item active"
              onClick={() => navigate("/for-you")}
            >
              <span className="category-strip-icon placeholder">FY</span>
              <span className="category-strip-label">For You</span>
            </button>

            {categories.map((category) => (
              <button
                key={category._id}
                type="button"
                className="category-strip-item"
                onClick={() => handleViewCategory(category)}
              >
                <span className="category-strip-icon">
                  <img
                    src={category.image}
                    alt={translateCategoryName(category.name)}
                    onError={(event) => {
                      event.target.onerror = null;
                      event.target.src = "/images/no-image.png";
                    }}
                  />
                </span>
                <span className="category-strip-label">
                  {translateCategoryName(category.name)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {isAuthenticated && recommendationsPersonalized && recommendedProducts.length > 0 && (
          <section className="recommended-strip-section">
            <div className="recommended-strip-head">
              <div>
                <h2>{t("home.recommendedTitle")}</h2>
                <p>{t("home.recommendedDescription")}</p>
              </div>
              <div className="recommended-strip-controls">
                <button
                  type="button"
                  className="recommended-strip-btn"
                  onClick={() => scrollRecommended("left")}
                  disabled={!canScrollRecommendedLeft}
                  aria-label="Scroll recommended products left"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button
                  type="button"
                  className="recommended-strip-btn"
                  onClick={() => scrollRecommended("right")}
                  disabled={!canScrollRecommendedRight}
                  aria-label="Scroll recommended products right"
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>

            <div className="recommended-strip-track" ref={recommendedStripRef}>
              {recommendedProducts.map((product) => (
                <div key={product._id} className="recommended-strip-card">
                  <ProductCard
                    product={product}
                    onView={(item) => navigate(`/product/${item._id}`)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section className="featured-section">
            <div className="section-header section-header-left">
              <div>
                <h2>{t("home.featuredProducts")}</h2>
                <p>{t("home.featuredDescription")}</p>
              </div>
            </div>
            <ProductList
              products={products}
              setProducts={setProducts}
              refreshEndpoint="/api/products?featured=true"
            />
          </section>
        )}
      </div>

    </div>
  );
};

export default HomePage;
