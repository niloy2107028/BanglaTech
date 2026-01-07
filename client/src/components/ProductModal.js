import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import "./ProductModal.css";

const ProductModal = ({ show, mode, product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "Laptop",
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

  const categories = [
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
    if (product && (mode === "edit" || mode === "view")) {
      setFormData({
        name: product.name || "",
        brand: product.brand || "",
        category: product.category || "Laptop",
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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "create") {
        await axios.post("/api/products", formData);
      } else if (mode === "edit") {
        await axios.put(`/api/products/${product._id}`, formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      setLoading(false);
    }
  };

  if (!show) return null;

  const isViewMode = mode === "view";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>
            {mode === "create" && "Add New Product"}
            {mode === "edit" && "Edit Product"}
            {mode === "view" && "Product Details"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {isViewMode ? (
            // View Mode
            <div className="product-details-view">
              <div className="detail-image">
                <img src={formData.image} alt={formData.name} />
              </div>
              <div className="detail-info">
                <div className="detail-row">
                  <strong>Product Name:</strong>
                  <span>{formData.name}</span>
                </div>
                <div className="detail-row">
                  <strong>Brand:</strong>
                  <span>{formData.brand}</span>
                </div>
                <div className="detail-row">
                  <strong>Category:</strong>
                  <span>{formData.category}</span>
                </div>
                <div className="detail-row">
                  <strong>Price:</strong>
                  <span className="price-highlight">
                    ৳{formData.price.toLocaleString()}
                  </span>
                </div>
                {formData.originalPrice && (
                  <div className="detail-row">
                    <strong>Original Price:</strong>
                    <span className="original-price">
                      ৳{formData.originalPrice.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <strong>Stock:</strong>
                  <span>{formData.stock} units</span>
                </div>
                <div className="detail-row">
                  <strong>Rating:</strong>
                  <span>
                    {formData.rating} / 5 ({formData.reviews} reviews)
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Featured:</strong>
                  <span>{formData.featured ? "Yes" : "No"}</span>
                </div>
                <div className="detail-row full-width">
                  <strong>Description:</strong>
                  <p>{formData.description}</p>
                </div>
              </div>
            </div>
          ) : (
            // Create/Edit Mode
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter product name"
                  />
                </div>

                <div className="form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    placeholder="Enter brand name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Price (৳) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Enter price"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Original Price (৳)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    min="0"
                    placeholder="Enter original price (optional)"
                  />
                </div>

                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Enter stock quantity"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
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
                  />
                </div>

                <div className="form-group">
                  <label>Number of Reviews</label>
                  <input
                    type="number"
                    name="reviews"
                    value={formData.reviews}
                    onChange={handleChange}
                    min="0"
                    placeholder="Enter review count"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image URL *</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  required
                  placeholder="Enter image URL"
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Enter product description"
                />
              </div>

              <div className="form-group checkbox-group">
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
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={loading}>
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
          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductModal;
