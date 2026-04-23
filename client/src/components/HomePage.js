import React, { useEffect, useState } from "react";
import axios from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

import CategoryCard from "./CategoryCard";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import ProductList from "./ProductList";
import "./HomePage.css";

const HomePage = () => {
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendationKeywords, setRecommendationKeywords] = useState([]);
  const [recommendationsPersonalized, setRecommendationsPersonalized] =
    useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentProduct, setCurrentProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t, translateCategoryName } = useLanguage();

  useEffect(() => {
    const loadHomePage = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCategories(),
          fetchFeaturedProducts(),
          isAuthenticated ? fetchRecommendations() : Promise.resolve(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadHomePage();
  }, [isAuthenticated]);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get("/api/products?featured=true");
      setProducts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      setProducts([]);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(
        "/api/products/recommendations?limit=8",
        {
          withCredentials: true,
        },
      );
      setRecommendedProducts(response.data.data || []);
      setRecommendationKeywords(response.data.keywords || []);
      setRecommendationsPersonalized(Boolean(response.data.personalized));
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendedProducts([]);
      setRecommendationKeywords([]);
      setRecommendationsPersonalized(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories");
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const trackProductView = async (productId) => {
    if (!isAuthenticated) return;

    try {
      await axios.post(
        `/api/products/${productId}/track-view`,
        {},
        { withCredentials: true },
      );
    } catch (error) {
      console.error("Error tracking product view:", error);
    }
  };

  const handleView = (product) => {
    trackProductView(product._id);
    navigate(`/product/${product._id}`);
  };

  const handleCreate = () => {
    setCurrentProduct(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCurrentProduct(null);
  };

  const handleModalSave = async () => {
    setShowModal(false);
    await Promise.all([
      fetchFeaturedProducts(),
      isAuthenticated ? fetchRecommendations() : Promise.resolve(),
    ]);
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

        {isAuthenticated &&
          recommendationsPersonalized &&
          recommendedProducts.length > 0 && (
            <section className="recommended-section">
              <div className="section-header section-header-left">
                <div>
                  <h2>{t("home.recommendedTitle")}</h2>
                  <p>{t("home.recommendedDescription")}</p>
                </div>
                {recommendationKeywords.length > 0 && (
                  <div className="recommendation-keywords">
                    {recommendationKeywords.slice(0, 6).map((keyword) => (
                      <span key={keyword} className="recommendation-chip">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="homepage-product-grid">
                {recommendedProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onView={handleView}
                  />
                ))}
              </div>
            </section>
          )}

        {isAuthenticated && user?.role === "seller" && (
          <button className="add-product-btn" onClick={handleCreate}>
            {t("home.addProduct")}
          </button>
        )}

        <section className="categories-section">
          <div className="section-header">
            <h2>{t("home.shopByCategory")}</h2>
            <p>{t("home.shopByCategoryDesc")}</p>
          </div>
          <div className="categories-grid">
            {categories.map((category) => (
              <CategoryCard
                key={category._id}
                category={translateCategoryName(category.name)}
                image={category.image}
                onClick={() =>
                  navigate(`/category/${encodeURIComponent(category.name)}`)
                }
              />
            ))}
          </div>
        </section>

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

      {showModal && (
        <ProductModal
          show={showModal}
          mode={modalMode}
          product={currentProduct}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default HomePage;
