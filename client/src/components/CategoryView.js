import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
// useParams() → Gets URL parameters (like category name from URL).
// useNavigate() → Used to navigate to another page (you commented it).

import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import "./CategoryView.css";

const CategoryView = ({ products = [], setProducts }) => {
  // /category/Laptop
  // categoryName = "Laptop"
  const { categoryName } = useParams();

  // const navigate = useNavigate();

  const category = decodeURIComponent(categoryName);
  // Converts URL-encoded text into normal text.
  // Example:
  // "Gaming%20Laptop" → "Gaming Laptop"

  const [filteredProducts, setFilteredProducts] = useState([]);
  // Stores products after filtering & sorting.
  const [priceSort, setPriceSort] = useState("");
  // Stores sorting option (low-to-high / high-to-low).
  const [selectedBrand, setSelectedBrand] = useState("");
  // Stores selected brand filter.
  const [showModal, setShowModal] = useState(false);
  // Controls modal visibility.
  const [modalMode, setModalMode] = useState("view");
  // Stores modal mode (view or edit).
  const [currentProduct, setCurrentProduct] = useState(null);
  // Stores product currently opened in modal.

  // Memoize categoryProducts to avoid recalculating on every render
  // In React:
  // Every time state changes → component re-renders.
  // When component re-renders:
  // All normal variables are recalculated
  // All filter/map operations run again
  // Even if nothing related changed.
  // That can slow your app if:
  // You have many products
  // You do heavy filtering/sorting

  const categoryProducts = useMemo(
    () =>
      products.filter((p) => {
        const productCategory =
          typeof p.category === "object" && p.category !== null
            ? p.category.name
            : p.categoryName;
        // category jodi onject hoy then Object.category.name
        // string hole category.name
        // category: { name: "Laptop" }
        // and sometimes:
        // categoryName: "Laptop"
        return productCategory === category;
        // Returns only products matching current category.
      }),
    [products, category],
    // “I will only recalculate this filter IF products or category changes.”
  );

  const brands = useMemo(
    // Step-by-step:
    // map() → get all brands
    // new Set() → remove duplicates
    // ... → convert Set back to array
    // sort() → sort alphabetically

    () => [...new Set(categoryProducts.map((p) => p.brand))].sort(),
    [categoryProducts],
    // Recalculate only when category products change.
  );

  // Reset filters when category changes
  useEffect(() => {
    // setPriceSort("");
    // setSelectedBrand("");
    resetFilters();
  }, [categoryName]);

  useEffect(() => {
    let result = [...categoryProducts];
    // Copy array (avoid mutating original)
    // The ... spread operator creates a new array copy.
    // just assign korle reference create hoto copy na

    // Filter by brand
    if (selectedBrand) {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    // Sort by price
    if (priceSort === "low-to-high") {
      result.sort((a, b) => a.price - b.price);
    } else if (priceSort === "high-to-low") {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [categoryProducts, priceSort, selectedBrand]);
  // ei 3 tar jekono akta change hoile ei portion run hbe

  const handleView = (product) => {
    setCurrentProduct(product);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`/api/products/${id}`);
        // window.location.reload();
        setProducts((prevProducts) =>
          prevProducts.filter((product) => product._id !== id),
        );
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product");
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCurrentProduct(null);
  };

  const handleModalSave = async () => {
    setShowModal(false);
    // window.location.reload();
    // This reloads entire page

    try {
      const response = await axios.get("/api/products");
      setProducts(response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const resetFilters = () => {
    setPriceSort("");
    setSelectedBrand("");
  };

  return (
    <div className="category-view">
      {console.log("I am category page")}

      <div className="category-view-container">
        {/* Header */}
        <div className="category-view-header">
          <h1>{category}</h1>
          <p>{filteredProducts.length} products found</p>
        </div>

        {/* Filters */}
        <div className="category-view-filters">
          <div className="category-view-filter-group">
            <label className="category-view-filter-label">Sort by Price:</label>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="category-view-filter-select"
            >
              <option value="">Default</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
            </select>
          </div>

          <div className="category-view-filter-group">
            <label className="category-view-filter-label">Brand:</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="category-view-filter-select"
            >
              <option value="">All Brands</option>
              {/* it's value is null  */}
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {(priceSort || selectedBrand) && (
            <button className="category-view-reset-btn" onClick={resetFilters}>
              Reset Filters
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="category-view-products-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="category-view-no-products">
            <p>No products found with the selected filters.</p>
            <button
              onClick={resetFilters}
              className="category-view-clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Product Modal */}
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

export default CategoryView;
