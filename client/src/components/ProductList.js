import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

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
  const [priceSort, setPriceSort] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("edit");
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsTopRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const { t, formatNumber } = useLanguage();

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(),
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

    if (selectedBrand) {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    if (priceSort === "low-to-high") {
      result.sort((a, b) => a.price - b.price);
    } else if (priceSort === "high-to-low") {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [products, priceSort, selectedBrand]);

  useEffect(() => {
    setCurrentPage(1);
  }, [products, priceSort, selectedBrand]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
    setPriceSort("");
    setSelectedBrand("");
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

        <div className="productList-view-filters">
          <div className="productList-view-filter-group">
            <label className="productList-view-filter-label">
              {t("common.sortByPrice")}
            </label>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="productList-view-filter-select"
            >
              <option value="">{t("common.default")}</option>
              <option value="low-to-high">{t("common.lowToHigh")}</option>
              <option value="high-to-low">{t("common.highToLow")}</option>
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

          {(priceSort || selectedBrand) && (
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
