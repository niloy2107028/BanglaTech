import React, { useState, useEffect, useRef } from 'react';
import axios from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPenToSquare, faTrash, faPlus, faLink, faUpload } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', image: '' });
  const [imageMode, setImageMode] = useState('url');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
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
    setImageMode('url');
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setCurrentCategory(category);
    setModalMode('edit');
    setFormData({ name: category.name, description: category.description || '', image: category.image || '' });
    setImageMode('url');
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      const useFile = imageMode === 'upload' && imageFile;
      if (useFile) {
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('description', formData.description);
        fd.append('image', imageFile);
        if (modalMode === 'create') {
          await axios.post('/api/categories', fd, { withCredentials: true });
        } else {
          await axios.put(`/api/categories/${currentCategory._id}`, fd, { withCredentials: true });
        }
      } else {
        if (modalMode === 'create') {
          await axios.post('/api/categories', formData, { withCredentials: true });
        } else {
          await axios.put(`/api/categories/${currentCategory._id}`, formData, { withCredentials: true });
        }
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
                  <div className="cat-image-tabs">
                    <button type="button" className={`cat-image-tab${imageMode === 'url' ? ' active' : ''}`} onClick={() => setImageMode('url')}>
                      <FontAwesomeIcon icon={faLink} /> URL
                    </button>
                    <button type="button" className={`cat-image-tab${imageMode === 'upload' ? ' active' : ''}`} onClick={() => setImageMode('upload')}>
                      <FontAwesomeIcon icon={faUpload} /> Upload
                    </button>
                  </div>

                  {imageMode === 'url' ? (
                    <>
                      <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder={t('category.imageUrlPlaceholder')} className="form-input" />
                      {formData.image && (
                        <div className="cat-preview-wrap">
                          <img src={formData.image} alt="Preview" className="cat-preview-img" onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=Invalid+URL'; }} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="cat-upload-area">
                      {imagePreview ? (
                        <div className="cat-preview-wrap">
                          <img src={imagePreview} alt="Preview" className="cat-preview-img" />
                          <button type="button" className="cat-preview-remove" onClick={handleRemoveFile}>
                            <FontAwesomeIcon icon={faTrash} /> Remove
                          </button>
                        </div>
                      ) : (
                        <label className="cat-upload-zone" htmlFor="cat-img-upload">
                          <FontAwesomeIcon icon={faUpload} className="cat-upload-icon" />
                          <span className="cat-upload-title">Click to upload image</span>
                          <span className="cat-upload-hint">JPG, PNG, WebP · max 8 MB</span>
                          <input id="cat-img-upload" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>
                  )}
                </div>

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
