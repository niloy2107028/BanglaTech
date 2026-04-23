import React, { useState, useEffect } from 'react';
import axios from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPenToSquare, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', image: '' });
  const { t, translateCategoryName } = useLanguage();

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    document.body.classList.toggle('modal-open', showModal);
    return () => document.body.classList.remove('modal-open');
  }, [showModal]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCurrentCategory(null);
    setModalMode('create');
    setFormData({ name: '', description: '', image: '' });
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setCurrentCategory(category);
    setModalMode('edit');
    setFormData({ name: category.name, description: category.description || '', image: category.image || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('category.deletePrompt'))) {
      try {
        await axios.delete(`/api/categories/${id}`, { withCredentials: true });
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(t('category.deleteFailed'));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await axios.post('/api/categories', formData, { withCredentials: true });
      } else {
        await axios.put(`/api/categories/${currentCategory._id}`, formData, { withCredentials: true });
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.message || t('category.saveFailed'));
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
            <h1 className="admin-title">{t('category.management')}</h1>
            <p className="admin-subtitle">{t('category.managementSubtitle')}</p>
          </div>
          <button className="btn-add-category" onClick={handleCreate}>
            <FontAwesomeIcon icon={faPlus} /> {t('category.addNewCategory')}
          </button>
        </header>

        {loading ? (
          <div className="admin-loading"><div className="loading-spinner"></div><p>{t('category.loadingCategories')}</p></div>
        ) : (
          <div className="category-grid">
            {categories.length === 0 ? (
              <div className="empty-state">{t('category.noCategories')}</div>
            ) : (
              categories.map((category) => (
                <div key={category._id} className="category-card">
                  <div className="category-card-image-box">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="category-img"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                    />
                  </div>
                  <div className="category-card-details">
                    <h3 className="category-name">{translateCategoryName(category.name)}</h3>
                    <p className="category-desc">{category.description || t('category.noDescription')}</p>
                    <div className="category-actions">
                      <button className="btn-icon-edit" onClick={() => handleEdit(category)} title={t('category.editCategory')}>
                        <FontAwesomeIcon icon={faPenToSquare} /> {t('common.edit')}
                      </button>
                      <button className="btn-icon-delete" onClick={() => handleDelete(category._id)} title={t('category.remove')}>
                        <FontAwesomeIcon icon={faTrash} /> {t('category.remove')}
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
            <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>{modalMode === 'create' ? t('category.createNew') : t('category.updateCategory')}</h2>
                <button className="btn-modal-close" onClick={() => setShowModal(false)}><FontAwesomeIcon icon={faXmark} /></button>
              </div>

              <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-group">
                  <label className="form-label">{t('category.categoryName')}</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder={t('category.categoryNamePlaceholder')} className="form-input" />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('category.description')}</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder={t('category.descriptionPlaceholder')} className="form-textarea" />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('category.imageUrl')}</label>
                  <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder={t('category.imageUrlPlaceholder')} className="form-input" />
                  <p className="form-hint">{t('category.imageHint')}</p>
                </div>

                {formData.image && (
                  <div className="image-preview-section">
                    <label className="form-label">{t('category.imagePreview')}</label>
                    <div className="preview-container">
                      <img src={formData.image} alt="Preview" className="preview-img" onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=Invalid+URL'; }} />
                    </div>
                  </div>
                )}

                <div className="admin-modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                  <button type="submit" className="btn-submit">{modalMode === 'create' ? t('category.createCategory') : t('category.saveChanges')}</button>
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
