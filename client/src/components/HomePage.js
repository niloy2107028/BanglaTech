import React, { useState, useEffect } from "react";
import axios from "axios";
// Used to send HTTP requests to backend

import { useNavigate } from "react-router-dom";
// Used to change page programmatically (navigate to another route).

import CategoryCard from "./CategoryCard";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import "./HomePage.css";

const HomePage = ({ products = [], setProducts }) => {
  // This is a functional component.
  // It receives products as props.

  const [showModal, setShowModal] = useState(false);
  // Controls whether modal is open or closed.
  const [modalMode, setModalMode] = useState("view");
  // Stores modal mode:
  // "view" → just viewing
  // "edit" → editing product

  const [currentProduct, setCurrentProduct] = useState(null);
  // Stores the selected product.

  const [categories, setCategories] = useState([]);
  // Stores categories list.

  const navigate = useNavigate();
  // Used to go to another page like:
  // navigate("/category/Electronics")

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories");
      console.log(response);
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Count Products Per Category
  const getCategoryProductCount = (categoryName) => {
    return products.filter((p) => {
      const productCategory =
        typeof p.category === "object" && p.category !== null
          ? p.category.name
          : p.categoryName;
      return productCategory === categoryName;
    }).length;
  };

  // Featured Products
  const featuredProducts = products.filter((p) => p.featured);

  // When user clicks view:
  // Store selected product
  // Set mode to view
  // Open modal
  const handleView = (product) => {
    // a function
    setCurrentProduct(product);
    setModalMode("view");
    setShowModal(true);
  };

  // Same as view but mode is "edit".
  const handleEdit = (product) => {
    setCurrentProduct(product);
    setModalMode("edit");
    setShowModal(true);
  };

  // Create New Product
  const handleCreate = () => {
    setCurrentProduct(null);
    setModalMode("create");
    setShowModal(true);
  };

  // Delete Product
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`/api/products/${id}`);
        // window.location.reload();
        // It:
        // Reloads the entire page
        // Destroys React state
        // Makes your app slow
        // Breaks SPA (Single Page Application) concept

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
    // Refresh products list
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  if (products.length === 0) {
    // as data fetching function is async function so loading will be shown untill fetch
    return (
      <div className="homepage-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="homepage">
      {console.log("I am home page")}
      <div className="homepage-container">
        {/* Add Product Button */}
        <div className="hero-section">
          <div>
            <h1>Welcome to BanglaMart</h1>
          </div>
          <button className="hero-button" onClick={handleCreate}>
            + Add New Product
          </button>
        </div>

        {/* Categories Section */}
        <section className="categories-section">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <p>Browse products from various categories</p>
          </div>
          <div className="categories-grid">
            {categories.map((category) => (
              <CategoryCard
                key={category._id}
                category={category.name}
                image={category.image}
                productCount={getCategoryProductCount(category.name)}
                onClick={() =>
                  navigate(`/category/${encodeURIComponent(category.name)}`)
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
              <p>Check out our featured items</p>
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
