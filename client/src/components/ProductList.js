import React, { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import { useLanguage } from "../context/LanguageContext";
import { trackLocalProductSignal } from "../utils/localRecommendation";

import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import "./ProductList.css";

const PRODUCTS_PER_PAGE = 12;

const ProductList = ({
  products = [],
  setProducts,
  title,
  showOwnerActions = false,
  refreshEndpoint = "/api/products",
}) => {
  const navigate = useNavigate();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("edit");
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsTopRef = useRef(null);
  const { t, formatNumber, translateCategoryName } = useLanguage();

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(),
    [products],
  );
  const categories = useMemo(
    () =>
      [...new Set(products.map((p) => p.categoryName).filter(Boolean))].sort(),
    [products],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );
  const pageStartIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(
    pageStartIndex,
    pageStartIndex + PRODUCTS_PER_PAGE,
  );
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  useEffect(() => {
    resetFilters();
  }, [products]);

  useEffect(() => {
    let result = [...products];
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (p) =>
          String(p.name || "").toLowerCase().includes(query) ||
          String(p.brand || "").toLowerCase().includes(query),
      );
    }
    const minPriceRaw = String(minPrice ?? "").trim();
    const maxPriceRaw = String(maxPrice ?? "").trim();
    const hasMinPrice = minPriceRaw !== "";
    const hasMaxPrice = maxPriceRaw !== "";
    const parsedMinPrice = hasMinPrice ? Number(minPriceRaw) : null;
    const parsedMaxPrice = hasMaxPrice ? Number(maxPriceRaw) : null;
    const minPriceValid =
      hasMinPrice && Number.isFinite(parsedMinPrice) && parsedMinPrice >= 0;
    const maxPriceValid =
      hasMaxPrice && Number.isFinite(parsedMaxPrice) && parsedMaxPrice >= 0;

    if (selectedBrand) {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    if (selectedCategory) {
      result = result.filter(
        (p) => String(p.categoryName || "") === String(selectedCategory),
      );
    }

    if (minPriceValid) {
      result = result.filter((p) => Number(p.price || 0) >= parsedMinPrice);
    }

    if (maxPriceValid) {
      result = result.filter((p) => Number(p.price || 0) <= parsedMaxPrice);
    }

    if (sortBy === "price_low") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "price_high") {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "rating_high") {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sortBy === "rating_low") {
      result.sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0));
    } else if (sortBy === "sold_high") {
      result.sort((a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0));
    }

    setFilteredProducts(result);
  }, [products, searchQuery, sortBy, selectedBrand, selectedCategory, minPrice, maxPrice]);

  useEffect(() => {
    setCurrentPage(1);
  }, [products, searchQuery, sortBy, selectedBrand, selectedCategory, minPrice, maxPrice]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleView = (product) => {
    trackLocalProductSignal(product);
    navigate(`/product/${product._id}`);
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("product.deletePrompt"))) {
      try {
        await axios.delete(`/api/products/${id}`, { withCredentials: true });
        setProducts((prevProducts) =>
          prevProducts.filter((product) => product._id !== id),
        );
      } catch (error) {
        console.error("Error deleting product:", error);
        alert(t("product.deleteFailed"));
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCurrentProduct(null);
  };

  const handleModalSave = async () => {
    setShowModal(false);

    try {
      const response = await axios.get(refreshEndpoint, {
        withCredentials: true,
      });
      setProducts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching products: ", error);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSortBy("");
    setSelectedBrand("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
  };

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === currentPage) return;

    setCurrentPage(nextPage);
    requestAnimationFrame(() => {
      productsTopRef.current?.scrollIntoView({ block: "start" });
    });
  };

  return (
    <div className="productList-view">
      <div className="productList-view-container" ref={productsTopRef}>
        <div className="productList-view-header">
          <h1>{title || t("common.allProducts")}</h1>
          <p>
            {t("common.productsFound", {
              count: formatNumber(filteredProducts.length),
            })}
          </p>
        </div>

        <div className="productList-view-search-bar">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="productList-view-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("common.searchProducts", {}, "Search products…")}
            className="productList-view-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="productList-view-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        <div className="productList-view-filters">
          <div className="productList-view-filter-group">
            <label className="productList-view-filter-label">
              {t("common.sortBy", {}, "Sort by")}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="productList-view-filter-select"
            >
              <option value="">{t("common.default")}</option>
              <option value="price_low">
                {t("common.lowToHigh", {}, "Price: Low to High")}
              </option>
              <option value="price_high">
                {t("common.highToLow", {}, "Price: High to Low")}
              </option>
              <option value="rating_high">
                {t("common.highestRating", {}, "Rating: High to Low")}
              </option>
              <option value="rating_low">
                {t("common.lowestRating", {}, "Rating: Low to High")}
              </option>
              <option value="sold_high">
                {t("common.bestSelling", {}, "Best Selling")}
              </option>
            </select>
          </div>

          <div className="productList-view-filter-group">
            <label className="productList-view-filter-label">
              {t("common.brand")}
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="productList-view-filter-select"
            >
              <option value="">{t("common.allBrands")}</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div className="productList-view-filter-group">
            <label className="productList-view-filter-label">
              {t("common.category", {}, "Category")}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="productList-view-filter-select"
            >
              <option value="">{t("common.allCategories", {}, "All Categories")}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {translateCategoryName(category)}
                </option>
              ))}
            </select>
          </div>

          <div className="productList-view-filter-group">
            <label className="productList-view-filter-label">
              {t("common.priceRange", {}, "Price Range")}
            </label>
            <div className="productList-view-price-range">
              <input
                type="number"
                min="0"
                step="1"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="productList-view-filter-input"
                placeholder={t("common.min", {}, "Min")}
              />
              <span className="productList-view-price-separator">-</span>
              <input
                type="number"
                min="0"
                step="1"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="productList-view-filter-input"
                placeholder={t("common.max", {}, "Max")}
              />
            </div>
          </div>

          {(searchQuery || sortBy || selectedBrand || selectedCategory || minPrice || maxPrice) && (
            <button
              className="productList-view-reset-btn"
              onClick={resetFilters}
            >
              {t("common.resetFilters")}
            </button>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <>
            <div className="productList-view-products-grid">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onView={handleView}
                  onEdit={showOwnerActions ? handleEdit : undefined}
                  onDelete={showOwnerActions ? handleDelete : undefined}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                className="productList-view-pagination"
                aria-label="Product list pagination"
              >
                <button
                  type="button"
                  className="productList-view-page-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t("common.previous", {}, "Previous")}
                </button>

                <div className="productList-view-page-numbers">
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`productList-view-page-number ${page === currentPage ? "active" : ""}`}
                      onClick={() => goToPage(page)}
                      aria-current={page === currentPage ? "page" : undefined}
                    >
                      {formatNumber(page)}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="productList-view-page-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t("common.next", {}, "Next")}
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="productList-view-no-products">
            <p>{t("common.noProductsSelectedFilters")}</p>
            <button
              onClick={resetFilters}
              className="productList-view-clear-filters-btn"
            >
              {t("common.clearFilters")}
            </button>
          </div>
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

export default ProductList;
