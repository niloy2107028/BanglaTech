import React, { useState, useEffect, useRef } from 'react';
import axios from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faUpload, faLink, faImage, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import './ProductModal.css';

const emptyForm = {
  name: '',
  brand: '',
  category: '',
  price: '',
  originalPrice: '',
  description: '',
  image: '',
  stock: '',
  featured: false,
};

const ProductModal = ({ show, mode, product, onClose, onSave }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [imageMode, setImageMode] = useState('url'); // 'url' | 'upload'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
  const { t, formatCurrency, translateCategoryName } = useLanguage();

  const viewCategoryName =
    product?.category?.name || product?.categoryName || '';

  useEffect(() => {
    axios.get('/api/categories').then(res => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (product && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        category: product.category?._id || product.category || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        description: product.description || '',
        image: product.image || '',
        stock: product.stock || '',
        featured: product.featured || false,
        rating: product.rating || '',
        reviews: product.reviews || '',
      });
      setImageFile(null);
      setImagePreview('');
      setImageMode('url');
    } else if (mode === 'create') {
      setFormData(emptyForm);
      setImageFile(null);
      setImagePreview('');
      setImageMode('url');
    }
  }, [product, mode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const useFile = imageMode === 'upload' && imageFile;

      if (useFile) {
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('brand', formData.brand);
        if (formData.category) fd.append('category', formData.category);
        fd.append('price', formData.price);
        if (formData.originalPrice) fd.append('originalPrice', formData.originalPrice);
        fd.append('stock', formData.stock);
        fd.append('description', formData.description);
        fd.append('featured', formData.featured);
        fd.append('image', imageFile);

        if (mode === 'create') {
          await axios.post('/api/products', fd, { withCredentials: true });
        } else if (mode === 'edit') {
          await axios.put(`/api/products/${product._id}`, fd, { withCredentials: true });
        }
      } else {
        const payload = {
          name: formData.name,
          brand: formData.brand,
          category: formData.category || undefined,
          price: formData.price,
          originalPrice: formData.originalPrice || undefined,
          stock: formData.stock,
          description: formData.description,
          featured: formData.featured,
          image: formData.image,
        };

        if (mode === 'create') {
          await axios.post('/api/products', payload, { withCredentials: true });
        } else if (mode === 'edit') {
          await axios.put(`/api/products/${product._id}`, payload, { withCredentials: true });
        }
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
                {formData.image
                  ? <img src={formData.image} alt={formData.name} className="product-modal-view-image" />
                  : <div className="product-modal-view-image-placeholder"><FontAwesomeIcon icon={faImage} /></div>
                }
              </div>
              <div className="product-modal-view-details">
                <div className="product-modal-view-row"><strong>{t('product.productName')}:</strong><span>{formData.name}</span></div>
                <div className="product-modal-view-row"><strong>{t('common.brand')}:</strong><span>{formData.brand}</span></div>
                {viewCategoryName && (
                  <div className="product-modal-view-row"><strong>{t('navbar.categories')}:</strong><span>{translateCategoryName(viewCategoryName)}</span></div>
                )}
                <div className="product-modal-view-row"><strong>{t('product.price')}:</strong><span className="product-modal-view-price">{formatCurrency(formData.price)}</span></div>
                {formData.originalPrice && <div className="product-modal-view-row"><strong>{t('product.originalPrice')}:</strong><span className="product-modal-view-original-price">{formatCurrency(formData.originalPrice)}</span></div>}
                <div className="product-modal-view-row"><strong>{t('product.stock')}:</strong><span>{formData.stock} {t('product.units')}</span></div>
                {formData.rating && (
                  <div className="product-modal-view-row"><strong>{t('product.rating')}:</strong><span>{formData.rating} / 5 ({formData.reviews} {t('common.reviews')})</span></div>
                )}
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

              <div className="product-modal-form-group">
                <label>{t('navbar.categories')}</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="product-modal-form-input"
                >
                  <option value="">{t('product.selectCategory') || '— Select category —'}</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{translateCategoryName(cat.name)}</option>
                  ))}
                </select>
              </div>

              <div className="product-modal-form-row">
                <div className="product-modal-form-group">
                  <label>{t('product.price')} (৳) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" placeholder={t('product.price')} className="product-modal-form-input" />
                </div>
                <div className="product-modal-form-group">
                  <label>{t('product.originalPrice')} (৳)</label>
                  <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} min="0" placeholder={t('product.originalPrice')} className="product-modal-form-input" />
                </div>
              </div>

              <div className="product-modal-form-group">
                <label>{t('product.stock')} *</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" placeholder={t('product.stock')} className="product-modal-form-input" />
              </div>

              {/* Image field — URL or Upload */}
              <div className="product-modal-form-group">
                <label>{t('product.image') || 'Product Image'} *</label>
                <div className="product-modal-image-tabs">
                  <button
                    type="button"
                    className={`product-modal-image-tab${imageMode === 'url' ? ' active' : ''}`}
                    onClick={() => setImageMode('url')}
                  >
                    <FontAwesomeIcon icon={faLink} /> URL
                  </button>
                  <button
                    type="button"
                    className={`product-modal-image-tab${imageMode === 'upload' ? ' active' : ''}`}
                    onClick={() => setImageMode('upload')}
                  >
                    <FontAwesomeIcon icon={faUpload} /> Upload
                  </button>
                </div>

                {imageMode === 'url' ? (
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    required={imageMode === 'url'}
                    placeholder="https://example.com/image.jpg"
                    className="product-modal-form-input"
                  />
                ) : (
                  <div className="product-modal-upload-area">
                    {imagePreview ? (
                      <div className="product-modal-preview-wrap">
                        <img src={imagePreview} alt="Preview" className="product-modal-preview-img" />
                        <button type="button" className="product-modal-preview-remove" onClick={handleRemoveFile}>
                          <FontAwesomeIcon icon={faTrash} /> Remove
                        </button>
                      </div>
                    ) : (
                      <label className="product-modal-upload-zone" htmlFor="product-img-upload">
                        <FontAwesomeIcon icon={faUpload} className="product-modal-upload-icon" />
                        <span className="product-modal-upload-title">Click to upload image</span>
                        <span className="product-modal-upload-hint">JPG, PNG, WebP · max 8 MB</span>
                        <input
                          id="product-img-upload"
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleFileChange}
                          required={imageMode === 'upload'}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                )}
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
