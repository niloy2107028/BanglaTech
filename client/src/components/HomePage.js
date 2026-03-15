import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
// Used to send HTTP requests to backend

import { useNavigate } from "react-router-dom";
// Used to change page programmatically (navigate to another route).
import { useAuth } from "../context/AuthContext";

import CategoryCard from "./CategoryCard";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import ProductList from "./ProductList";
import "./HomePage.css";

const HomePage = () => {
  // This is a functional component.
  // It receives products as props.

  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
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
  const { user, isAuthenticated } = useAuth();
  // Used to go to another page like:
  // navigate("/category/Electronics")

  useEffect(() => {
    fetchCategories();
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get("/api/products?featured=true");

      setProducts(response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories");
      // console.log(response);
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Count Products Per Category
  // const getCategoryProductCount = (categoryName) => {
  //   return products.filter((p) => {
  //     const productCategory = p.category.name;

  //     return productCategory === categoryName;
  //   }).length;
  // };
  // instead we will create a map
  // it will cause o(n) time instead of o(mn)

  // const categoryCount = useMemo(() => {
  //   const counts = {};

  //   products.forEach((product) => {
  //     const name = product.category.name;
  //     counts[name] = (counts[name] || 0) + 1;
  //   });

  //   return counts;
  // }, [products]);

  // Now React will recompute categoryCount only when products change.
  // no need reason in this component we are not getting all the products

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
        {isAuthenticated && user?.role === "seller" && (
          <div className="hero-section">
            <div>
              <h1>Welcome to BanglaMart</h1>
            </div>
            <button className="hero-button" onClick={handleCreate}>
              + Add New Product
            </button>
          </div>
        )}

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
                // productCount={categoryCount[category.name]}
                onClick={
                  () =>
                    navigate(`/category/${encodeURIComponent(category.name)}`)

                  // This makes the category name safe for URLs.
                  // Example:
                  // Category Name	  Encoded URL
                  // Home Appliances	Home%20Appliances
                  // Men & Women	    Men%20%26%20Women
                }
              />
            ))}
          </div>
        </section>

        {/* Featured Products Section */}
        {products.length > 0 && (
          <section className="featured-section">
            <div className="section-header">
              <h2>Featured Products</h2>
              <p>Check out our featured items</p>
            </div>
            <ProductList products={products} setProducts={setProducts} />
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
