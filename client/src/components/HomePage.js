import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CategoryCard from "./CategoryCard";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import "./HomePage.css";

const HomePage = ({ products = [] }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [currentProduct, setCurrentProduct] = useState(null);
  const navigate = useNavigate();

  const categories = [
    "Electronics",
    "Fashion",
    "Home & Living",
    "Beauty & Health",
    "Sports & Outdoors",
    "Books & Stationery",
    "Toys & Games",
    "Automotive",
    "Food & Groceries",
    "Mobile & Accessories",
  ];

  const getCategoryProductCount = (category) => {
    return products.filter((p) => p.category === category).length;
  };

  const featuredProducts = products.filter((p) => p.featured);

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

  if (products.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="homepage-container">
      <div className="container">
        {/* Categories Section */}
        <section className="categories-section">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <p>Browse products from various categories</p>
          </div>
          <div className="categories-grid">
            {categories.map((category) => (
              <CategoryCard
                key={category}
                category={category}
                productCount={getCategoryProductCount(category)}
                onClick={() =>
                  navigate(`/category/${encodeURIComponent(category)}`)
                }
              />
            ))}
          </div>
        </section>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="featured-section">
            <div className="section-header">
              <h2>Featured Products</h2>
              <p>Check out our handpicked featured items</p>
            </div>
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
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

export default HomePage;
