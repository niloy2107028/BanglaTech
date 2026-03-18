import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
// Imports axios → used to send HTTP requests to backend (API).
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// Lets you display icons from FontAwesome.

import {
  faXmark,
  faPenToSquare,
  faTrash,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
// These icons will be used in buttons and categories.
import "./CategoryManagement.css";

const CategoryManagement = () => {
  // State Variables
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);
  // Runs once when page loads.

  useEffect(() => {
    if (showModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showModal]);
  // When component mounts
  // Every time showModal changes (true → false OR false → true)
  // Lock body scroll when modal opens and unlock it when modal closes
  // Cleanup ensures scroll is restored if component unmounts or state changes

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/categories");
      setCategories(response.data.data);
      // Stores categories in state.
      setLoading(false);
      // Stop loading spinner.
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCurrentCategory(null);
    setModalMode("create");
    setFormData({ name: "", description: "", image: "" });
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setCurrentCategory(category);
    setModalMode("edit");
    setFormData({
      name: category.name,
      description: category.description || "",
      image: category.image || "",
    });
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file");
      return;
    }

    // Check file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image size should be less than 2MB");
      return;
    }

    setUploadError("");
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // # Why We Need This?
    // Because before uploading to server:
    // The file is not online
    // It doesn’t have a URL yet
    // So we create a temporary preview
    // # Flow Summary
    // User selects image
    // FileReader reads it
    // Converts it to base64 string
    // Save in state
    // <img src={imagePreview} /> shows preview
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? This may affect existing products.",
      )
    ) {
      try {
        await axios.delete(`/api/categories/${id}`);
        fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Failed to delete category");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "create") {
        await axios.post("/api/categories", formData);
      } else {
        await axios.put(`/api/categories/${currentCategory._id}`, formData);
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert(error.response?.data?.message || "Failed to save category");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="admin-page category-mgmt-page">
      <div className="admin-container">
        <header className="admin-header category-header">
          <div className="header-content">
            <h1 className="admin-title">Category Management</h1>
            <p className="admin-subtitle">Organize and manage product categories for the platform.</p>
          </div>
          <button
            className="btn-add-category"
            onClick={handleCreate}
          >
            <FontAwesomeIcon icon={faPlus} /> Add New Category
          </button>
        </header>

        {loading ? (
          <div className="admin-loading">
            <div className="loading-spinner"></div>
            <p>Loading categories...</p>
          </div>
        ) : (
          <div className="category-grid">
            {categories.length === 0 ? (
              <div className="empty-state">No categories found. Start by adding one.</div>
            ) : (
              categories.map((category) => (
                <div key={category._id} className="category-card">
                  <div className="category-card-image-box">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="category-img"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                  </div>
                  <div className="category-card-details">
                    <h3 className="category-name">{category.name}</h3>
                    <p className="category-desc">
                      {category.description || "No description provided for this category."}
                    </p>
                    <div className="category-actions">
                      <button
                        className="btn-icon-edit"
                        onClick={() => handleEdit(category)}
                        title="Edit Category"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} /> Edit
                      </button>
                      <button
                        className="btn-icon-delete"
                        onClick={() => handleDelete(category._id)}
                        title="Delete Category"
                      >
                        <FontAwesomeIcon icon={faTrash} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showModal && (
          <div className="admin-modal-overlay">
            <div
              className="admin-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <h2>
                  {modalMode === "create"
                    ? "Create New Category"
                    : "Update Category"}
                </h2>
                <button
                  className="btn-modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="admin-form"
              >
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Electronics, Fashion"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Brief description of the category..."
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category Image URL</label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="form-input"
                  />
                  <p className="form-hint">Paste a direct link to the category image.</p>
                </div>

                {formData.image && (
                  <div className="image-preview-section">
                    <label className="form-label">Image Preview</label>
                    <div className="preview-container">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="preview-img"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/200?text=Invalid+URL";
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                  >
                    {modalMode === "create"
                      ? "Create Category"
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;
