import React, { useState, useEffect } from "react";
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
  // Stores input values from form.
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadError, setUploadError] = useState("");

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
    setImageFile(null);
    setImagePreview("");
    setUploadError("");
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
    // data update
    setImageFile(null);
    setImagePreview(category.image || "");
    setUploadError("");
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
    // form submit er por jeno redirect na hoy
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);

      if (imageFile) {
        submitData.append("image", imageFile);
      } else if (formData.image) {
        // Keep existing image URL if no new file uploaded
        submitData.append("imageUrl", formData.image);
      }

      if (modalMode === "create") {
        await axios.post("/api/categories", submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.put(`/api/categories/${currentCategory._id}`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert(error.response?.data?.message || "Failed to save category");

      // error
      // This is the error object from axios.
      // When API fails, axios gives something like:
      // {
      //   response: {
      //     data: {
      //       message: "Category name already exists"
      //     }
      //   }
      // }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="category-management">
      <div className="category-management-container">
        <div className="category-management-header">
          <div className="category-management-header-text">
            <h1>Category Management</h1>
            <p>Manage product categories for your store</p>
          </div>
          <button
            className="category-management-add-btn"
            onClick={handleCreate}
          >
            <FontAwesomeIcon icon={faPlus} /> Add Category
          </button>
        </div>

        {/* <div className="category-management-loading">
          <div className="category-management-loading-spinner"></div>
          <p>Loading categories...</p>
        </div> */}

        {loading ? (
          <div className="category-management-loading">
            <div className="category-management-loading-spinner"></div>
            <p>Loading categories...</p>
          </div>
        ) : (
          <div className="category-management-grid">
            {categories.map((category) => (
              <div key={category._id} className="category-management-card">
                <div className="category-management-card-image-wrapper">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="category-management-card-image"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/60?text=No+Image";
                    }}
                  />
                </div>
                <div className="category-management-card-content">
                  <h3 className="category-management-card-title">
                    {category.name}
                  </h3>
                  <p className="category-management-card-description">
                    {category.description || "No description"}
                  </p>
                </div>
                <div className="category-management-card-actions">
                  <button
                    className="category-management-action-btn category-management-edit-btn"
                    onClick={() => handleEdit(category)}
                    title="Edit Category"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  <button
                    className="category-management-action-btn category-management-delete-btn"
                    onClick={() => handleDelete(category._id)}
                    title="Delete Category"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div
            className="category-management-modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <div
              className="category-management-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="category-management-modal-header">
                <h2>
                  {modalMode === "create"
                    ? "Add New Category"
                    : "Edit Category"}
                </h2>
                <button
                  className="category-management-modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="category-management-form"
              >
                <div className="category-management-form-group">
                  <label className="category-management-form-label">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter category name"
                    className="category-management-form-input"
                  />
                </div>

                <div className="category-management-form-group">
                  <label className="category-management-form-label">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter category description"
                    className="category-management-form-textarea"
                  />
                </div>

                <div className="category-management-form-group">
                  <label className="category-management-form-label">
                    Category Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="category-management-form-file"
                  />
                  {uploadError && (
                    <p className="category-management-upload-error">
                      {uploadError}
                    </p>
                  )}
                  <p className="category-management-upload-hint">
                    Upload an image (max 2MB). Supported formats: JPG, PNG, GIF,
                    WebP
                  </p>

                  {imagePreview && (
                    <div className="category-management-preview-wrapper">
                      <p className="category-management-preview-label">
                        Preview:
                      </p>
                      <div className="category-management-preview-image-wrapper">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="category-management-preview-image"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="category-management-form-actions">
                  <button
                    type="button"
                    className="category-management-form-btn category-management-cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="category-management-form-btn category-management-submit-btn"
                  >
                    {modalMode === "create"
                      ? "Create Category"
                      : "Update Category"}
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
