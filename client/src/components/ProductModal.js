import React, { useState, useEffect } from 'react';
import axios from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import './ProductModal.css';

const emptyForm = {
  name: '',
  brand: '',
  category: '',
  categoryName: '',
  price: '',
  originalPrice: '',
  description: '',
  image: '',
  stock: '',
  featured: false,
  rating: '',
  reviews: '',
};

const ProductModal = ({ show, mode, product, onClose, onSave }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const { t, formatCurrency, translateCategoryName } = useLanguage();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        setCategories(response.data.data || []);
      } catch (fetchError) {
        console.error('Error fetching categories:', fetchError);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (product && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        category:
          typeof product.category === 'object' && product.category !== null
            ? product.category._id
            : product.category,
        categoryName: product.category?.name || product.categoryName || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        description: product.description || '',
        image: product.image || '',
        stock: product.stock || '',
        featured: product.featured || false,
        rating: product.rating || '',
        reviews: product.reviews || '',
      });
    } else if (mode === 'create') {
      setFormData(emptyForm);
    }
  }, [product, mode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'create') {
        await axios.post('/api/products', formData, { withCredentials: true });
      } else if (mode === 'edit') {
        await axios.put(`/api/products/${product._id}`, formData, { withCredentials: true });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (!show) return null;
  const isViewMode = mode === 'view';

  return (
    <div className="product-modal-overlay">
      <div className="product-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="product-modal-header">
          <h2>
            {mode === 'create' && t('product.addNewProduct')}
            {mode === 'edit' && t('product.editProduct')}
            {mode === 'view' && t('product.productDetails')}
          </h2>
          <button className="product-modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="product-modal-body">
          {isViewMode ? (
            <div className="product-modal-view">
              <div className="product-modal-view-image-wrapper">
                <img src={formData.image} alt={formData.name} className="product-modal-view-image" />
              </div>
              <div className="product-modal-view-details">
                <div className="product-modal-view-row"><strong>{t('product.productName')}:</strong><span>{formData.name}</span></div>
                <div className="product-modal-view-row"><strong>{t('common.brand')}:</strong><span>{formData.brand}</span></div>
                <div className="product-modal-view-row"><strong>{t('navbar.categories')}:</strong><span>{translateCategoryName(formData.categoryName)}</span></div>
                <div className="product-modal-view-row"><strong>{t('product.price')}:</strong><span className="product-modal-view-price">{formatCurrency(formData.price)}</span></div>
                {formData.originalPrice && <div className="product-modal-view-row"><strong>{t('product.originalPrice')}:</strong><span className="product-modal-view-original-price">{formatCurrency(formData.originalPrice)}</span></div>}
                <div className="product-modal-view-row"><strong>{t('product.stock')}:</strong><span>{formData.stock} {t('product.units')}</span></div>
                <div className="product-modal-view-row"><strong>{t('product.rating')}:</strong><span>{formData.rating} / 5 ({formData.reviews} {t('common.reviews')})</span></div>
                <div className="product-modal-view-row"><strong>{t('product.featured')}:</strong><span>{formData.featured ? t('common.yes') : t('common.no')}</span></div>
                <div className="product-modal-view-description"><strong>{t('product.description')}:</strong><p>{formData.description}</p></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="product-modal-error">{error}</div>}

              <div className="product-modal-form-row">
                <div className="product-modal-form-group">
                  <label>{t('product.productName')} *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder={t('product.productName')} className="product-modal-form-input" />
                </div>
                <div className="product-modal-form-group">
                  <label>{t('common.brand')} *</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleChange} required placeholder={t('common.brand')} className="product-modal-form-input" />
                </div>
              </div>

              <div className="product-modal-form-row">
                <div className="product-modal-form-group">
                  <label>{t('navbar.categories')} *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required className="product-modal-form-input">
                    <option value="">{t('category.categoryName')}</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{translateCategoryName(cat.name)}</option>
                    ))}
                  </select>
                </div>
                <div className="product-modal-form-group">
                  <label>{t('product.price')} (৳) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" placeholder={t('product.price')} className="product-modal-form-input" />
                </div>
              </div>

              <div className="product-modal-form-row">
                <div className="product-modal-form-group">
                  <label>{t('product.originalPrice')} (৳)</label>
                  <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} min="0" placeholder={t('product.originalPrice')} className="product-modal-form-input" />
                </div>
                <div className="product-modal-form-group">
                  <label>{t('product.stock')} *</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" placeholder={t('product.stock')} className="product-modal-form-input" />
                </div>
              </div>

              <div className="product-modal-form-row">
                <div className="product-modal-form-group">
                  <label>{t('product.rating')} (0-5)</label>
                  <input type="number" name="rating" value={formData.rating} onChange={handleChange} min="0" max="5" step="0.1" placeholder={t('product.rating')} className="product-modal-form-input" />
                </div>
                <div className="product-modal-form-group">
                  <label>{t('common.reviews')}</label>
                  <input type="number" name="reviews" value={formData.reviews} onChange={handleChange} min="0" placeholder={t('common.reviews')} className="product-modal-form-input" />
                </div>
              </div>

              <div className="product-modal-form-group">
                <label>{t('category.imageUrl')} *</label>
                <input type="url" name="image" value={formData.image} onChange={handleChange} required placeholder={t('category.imageUrl')} className="product-modal-form-input" />
              </div>

              <div className="product-modal-form-group">
                <label>{t('product.description')} *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows="4" placeholder={t('product.description')} className="product-modal-form-textarea" />
              </div>

              <div className="product-modal-form-checkbox">
                <label>
                  <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} />
                  <span>{t('product.featured')}</span>
                </label>
              </div>

              <div className="product-modal-footer">
                <button type="button" className="product-modal-btn-cancel" onClick={onClose}>{t('common.cancel')}</button>
                <button type="submit" className="product-modal-btn-submit" disabled={loading}>
                  {loading ? 'Saving...' : mode === 'create' ? t('product.addNewProduct') : t('product.editProduct')}
                </button>
              </div>
            </form>
          )}
        </div>

        {isViewMode && (
          <div className="product-modal-footer">
            <button className="product-modal-btn-cancel" onClick={onClose}>{t('common.close')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductModal;
