import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import "./ProductModal.css";

const ProductModal = ({ show, mode, product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    categoryName: "",
    price: "",
    originalPrice: "",
    description: "",
    image: "",
    stock: "",
    featured: false,
    rating: "",
    reviews: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories");
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    console.log("kire : " + product.category.name);
    if (product && (mode === "edit" || mode === "view")) {
      setFormData({
        name: product.name || "",
        brand: product.brand || "",
        category:
          typeof product.category === "object" && product.category !== null
            ? product.category._id
            : product.category,
        categoryName: product.category.name,
        price: product.price || "",
        originalPrice: product.originalPrice || "",
        description: product.description || "",
        image: product.image || "",
        stock: product.stock || "",
        featured: product.featured || false,
        rating: product.rating || "",
        reviews: product.reviews || "",
      });
    }
  }, [product, mode]);

  const handleChange = (e) => {
    // <input name="price" onChange={handleChange} />
    // When user changes any input, this function updates that specific field in formData automatically.
    const { name, value, type, checked } = e.target;
    // Take these from the input attributes

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
      // Use the input’s name as the key.
      // If input is checkbox → use true/false
      // Otherwise → use input value
    });
  };

  const handleSubmit = async (e) => {
    // Runs when form is submitted
    // <form onSubmit={handleSubmit}></form>
    e.preventDefault();
    // Prevents page reload.
    // Normally:
    // Submitting form reloads page

    setLoading(true);
    setError("");

    try {
      if (mode === "create") {
        await axios.post("/api/products", formData, { withCredentials: true });
      } else if (mode === "edit") {
        await axios.put(`/api/products/${product._id}`, formData, {
          withCredentials: true,
        });
      }
      onSave();
      // it calls handleModalSave. Reason it do the re-rendering of updated product
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      setLoading(false);
    }
  };

  if (!show) return null;
  // Login for the modal will or will not appear on screen

  const isViewMode = mode === "view";

  return (
    <div className="product-modal-overlay">
      {/* onClick={onClose} */}
      <div
        className="product-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* e.stopPropagation keno?
        In JavaScript:

        When you click a child element →
        The event goes upward to its parent →
        Then parent’s parent →
        Until it reaches the root.

        This is called event bubbling.

        So normally:

        Click inside .modal-content
        It triggers .modal-content
        Then it ALSO triggers .modal-overlay
        Modal closes
        (e) => e.stopPropagation()
        It means:
        “Stop the event from going to parent elements.” */}

        {/* Modal Header */}
        <div className="product-modal-header">
          <h2>
            {mode === "create" && "Add New Product"}
            {mode === "edit" && "Edit Product"}
            {mode === "view" && "Product Details"}
          </h2>
          <button className="product-modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="product-modal-body">
          {isViewMode ? (
            // View Mode
            <div className="product-modal-view">
              <div className="product-modal-view-image-wrapper">
                <img
                  src={formData.image}
                  alt={formData.name}
                  className="product-modal-view-image"
                />
              </div>
              <div className="product-modal-view-details">
                <div className="product-modal-view-row">
                  <strong>Product Name:</strong>
                  <span>{formData.name}</span>
                </div>
                <div className="product-modal-view-row">
                  <strong>Brand:</strong>
                  <span>{formData.brand}</span>
                </div>
                <div className="product-modal-view-row">
                  <strong>Category:</strong>
                  <span>{formData.categoryName}</span>
                </div>
                <div className="product-modal-view-row">
                  <strong>Price:</strong>
                  <span className="product-modal-view-price">
                    ৳{formData.price.toLocaleString()}
                  </span>
                </div>
                {formData.originalPrice && (
                  <div className="product-modal-view-row">
                    <strong>Original Price:</strong>
                    <span className="product-modal-view-original-price">
                      ৳{formData.originalPrice.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="product-modal-view-row">
                  <strong>Stock:</strong>
                  <span>{formData.stock} units</span>
                </div>
                <div className="product-modal-view-row">
                  <strong>Rating:</strong>
                  <span>
                    {formData.rating} / 5 ({formData.reviews} reviews)
                  </span>
                </div>
                <div className="product-modal-view-row">
                  <strong>Featured:</strong>
                  <span>{formData.featured ? "Yes" : "No"}</span>
                </div>
                <div className="product-modal-view-description">
                  <strong>Description:</strong>
                  <p>{formData.description}</p>
                </div>
              </div>
            </div>
          ) : (
            // Create/Edit Mode
            <form onSubmit={handleSubmit}>
              {error && <div className="product-modal-error">{error}</div>}

              <div className="product-modal-form-row">
                <div className="product-modal-form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter product name"
                    className="product-modal-form-input"
                  />
                </div>

                <div className="product-modal-form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    placeholder="Enter brand name"
                    className="product-modal-form-input"
                  />
                </div>
              </div>

              <div className="product-modal-form-row">
                <div className="product-modal-form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="product-modal-form-input"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="product-modal-form-group">
                  <label>Price (৳) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Enter price"
                    className="product-modal-form-input"
                  />
                </div>
              </div>

              <div className="product-modal-form-row">
                <div className="product-modal-form-group">
                  <label>Original Price (৳)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    min="0"
                    placeholder="Enter original price (optional)"
                    className="product-modal-form-input"
                  />
                </div>

                <div className="product-modal-form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Enter stock quantity"
                    className="product-modal-form-input"
                  />
                </div>
              </div>

              <div className="product-modal-form-row">
                <div className="product-modal-form-group">
                  <label>Rating (0-5)</label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    step="0.1"
                    placeholder="Enter rating"
                    className="product-modal-form-input"
                  />
                </div>

                <div className="product-modal-form-group">
                  <label>Number of Reviews</label>
                  <input
                    type="number"
                    name="reviews"
                    value={formData.reviews}
                    onChange={handleChange}
                    min="0"
                    placeholder="Enter review count"
                    className="product-modal-form-input"
                  />
                </div>
              </div>

              <div className="product-modal-form-group">
                <label>Image URL *</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  required
                  placeholder="Enter image URL"
                  className="product-modal-form-input"
                />
              </div>

              <div className="product-modal-form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Enter product description"
                  className="product-modal-form-textarea"
                />
              </div>

              <div className="product-modal-form-checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                  />
                  <span>Featured Product</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="product-modal-footer">
                <button
                  type="button"
                  className="product-modal-btn-cancel"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="product-modal-btn-submit"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : mode === "create"
                      ? "Create Product"
                      : "Update Product"}
                </button>
              </div>
            </form>
          )}
        </div>

        {isViewMode && (
          <div className="product-modal-footer">
            <button className="product-modal-btn-cancel" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductModal;
