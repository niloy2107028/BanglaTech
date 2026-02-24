import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import "./CategoryManagement.css";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "📦",
  });

  const icons = [
    "📱",
    "💻",
    "🖥️",
    "🎮",
    "📷",
    "🎧",
    "⌚",
    "🔧",
    "💾",
    "📡",
    "👔",
    "👗",
    "👞",
    "👜",
    "🏠",
    "🛋️",
    "🪴",
    "💄",
    "🏃",
    "⚽",
    "📚",
    "✏️",
    "🧸",
    "🚗",
    "🍎",
    "🍕",
    "📦",
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/categories");
      setCategories(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCurrentCategory(null);
    setModalMode("create");
    setFormData({ name: "", description: "", icon: "📦" });
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setCurrentCategory(category);
    setModalMode("edit");
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "📦",
    });
    setShowModal(true);
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
    <div className="category-management">
      <div className="container">
        <div className="category-header">
          <div>
            <h1>Category Management</h1>
            <p>Manage product categories for your store</p>
          </div>
          <button className="btn-add-category" onClick={handleCreate}>
            <FaPlus /> Add Category
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading categories...</p>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category._id} className="category-card">
                <div className="category-icon">{category.icon}</div>
                <div className="category-info">
                  <h3>{category.name}</h3>
                  <p>{category.description || "No description"}</p>
                </div>
                <div className="category-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(category)}
                    title="Edit Category"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(category._id)}
                    title="Delete Category"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {modalMode === "create"
                    ? "Add New Category"
                    : "Edit Category"}
                </h2>
                <button
                  className="close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="category-form">
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter category name"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter category description"
                  />
                </div>

                <div className="form-group">
                  <label>Icon</label>
                  <div className="icon-selector">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${
                          formData.icon === icon ? "selected" : ""
                        }`}
                        onClick={() => setFormData({ ...formData, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
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
