import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import "./CategoryView.css";

const CategoryView = ({ products }) => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const category = decodeURIComponent(categoryName);

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [priceSort, setPriceSort] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [currentProduct, setCurrentProduct] = useState(null);

  const categoryProducts = products.filter((p) => p.category === category);
  const brands = [...new Set(categoryProducts.map((p) => p.brand))].sort();

  // Reset filters when category changes
  useEffect(() => {
    setPriceSort("");
    setSelectedBrand("");
  }, [categoryName]);

  useEffect(() => {
    let result = [...categoryProducts];

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
  }, [categoryProducts, priceSort, selectedBrand, categoryName]);

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
        window.location.reload();
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

  const handleModalSave = () => {
    setShowModal(false);
    window.location.reload();
  };

  const resetFilters = () => {
    setPriceSort("");
    setSelectedBrand("");
  };

  return (
    <div className="category-view-container">
      <div className="container">
        {/* Back Button */}
        <button
          className="btn-back"
          onClick={() => (window.location.href = "/")}
        >
          ← Back to Home
        </button>

        {/* Header */}
        <div className="category-header">
          <h1>{category}</h1>
          <p className="product-count">
            {filteredProducts.length} products found
          </p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Sort by Price:</label>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="filter-select"
            >
              <option value="">Default</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Brand:</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="filter-select"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {(priceSort || selectedBrand) && (
            <button className="btn-reset-filters" onClick={resetFilters}>
              Reset Filters
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="products-grid">
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
          <div className="no-products">
            <p>No products found with the selected filters.</p>
            <button onClick={resetFilters} className="btn-reset">
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
