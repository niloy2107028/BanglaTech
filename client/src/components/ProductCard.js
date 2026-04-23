import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './ProductCard.css';

const ProductCard = ({ product, onDelete, onEdit, onView }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { t, formatCurrency, formatNumber } = useLanguage();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="product-card">
      {discount > 0 && <div className="product-discount-badge">-{discount}%</div>}

      <div className="product-image-wrapper" onClick={() => onView(product)}>
        <img src={product.image} alt={product.name} className="product-image" />
        {!product.inStock && <div className="product-out-of-stock-overlay">{t('common.outOfStock')}</div>}
      </div>

      <div className="product-info">
        <div className="product-brand">{product.brand}</div>
        <h3 className="product-name" onClick={() => onView(product)}>
          {product.name}
        </h3>

        <div className="product-rating">
          <div className="product-stars">
            {[...Array(5)].map((_, index) => (
              <FontAwesomeIcon
                key={index}
                icon={faStar}
                className={`product-star ${
                  index < Math.floor(product.rating) ? 'product-star-filled' : 'product-star-empty'
                }`}
              />
            ))}
          </div>
          <span className="product-rating-text">
            {product.rating} ({formatNumber(product.reviews)} {t('common.reviews')})
          </span>
        </div>

        <div className="product-price-wrapper">
          <div className="product-price">{formatCurrency(product.price)}</div>
          {product.originalPrice && (
            <div className="product-original-price">{formatCurrency(product.originalPrice)}</div>
          )}
        </div>

        <div className="product-meta-row">
          <span className="product-seller-label">{t('common.seller')}</span>
          <span className="product-seller-name">{product.seller?.name || 'BanglaMart'}</span>
        </div>

        <div
          className={`product-stock-badge ${
            product.inStock ? 'product-stock-in' : 'product-stock-out'
          }`}
        >
          {product.inStock ? t('common.inStockCount', { count: formatNumber(product.stock) }) : t('common.outOfStock')}
        </div>

        <div className="product-actions">
          <button
            className="product-action-btn product-action-btn-view"
            onClick={() => onView(product)}
            title={t('product.viewDetails')}
          >
            {t('common.view')}
          </button>

          {(!user || user.role === 'buyer') && (
            <button
              className="product-action-btn product-action-btn-cart"
              onClick={() => addToCart(product._id)}
              disabled={!product.inStock}
              title={t('product.addToCart')}
            >
              <FontAwesomeIcon icon={faCartPlus} />
            </button>
          )}

          {onEdit && (
            <button
              className="product-action-btn product-action-btn-edit"
              onClick={() => onEdit(product)}
              title={t('common.edit')}
            >
              {t('common.edit')}
            </button>
          )}

          {onDelete && (
            <button
              className="product-action-btn product-action-btn-delete"
              onClick={() => onDelete(product._id)}
              title={t('common.delete')}
            >
              {t('common.delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
