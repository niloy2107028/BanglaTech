import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import "./ProductList.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [currentProduct, setCurrentProduct] = useState(null);

  const categories = [
    "All",
    "Laptop",
    "Desktop",
    "Monitor",
    "Components",
    "Accessories",
    "Networking",
    "Storage",
    "Gaming",
    "Mobile",
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/products");
      setProducts(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`/api/products/${id}`);
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product");
      }
    }
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleView = (product) => {
    setCurrentProduct(product);
    setModalMode("view");
    setShowModal(true);
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

  const handleModalSave = () => {
    setShowModal(false);
    fetchProducts();
  };

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="product-list-container">
      <div className="container">
        {/* Header with Add Product Button */}
        <div className="products-header">
          <h1>All Products</h1>
          <button className="btn-add-product" onClick={handleCreate}>
            + Add New Product
          </button>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          <div className="category-scroll">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${
                  selectedCategory === category ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
            {selectedCategory !== "All" && (
              <button
                className="clear-filter-btn"
                onClick={() => setSelectedCategory("All")}
                title="Clear filter"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : (
          <>
            <div className="products-count">
              Showing {filteredProducts.length} products
            </div>
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onView={handleView}
                />
              ))}
            </div>
          </>
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

export default ProductList;
