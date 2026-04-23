import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faMinus, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, cartTotalPrice } = useCart();
  const navigate = useNavigate();
  const { t, formatCurrency } = useLanguage();

  if (cart.items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-content">
          <h2>{t('cart.emptyTitle')}</h2>
          <p>{t('cart.emptyDescription')}</p>
          <Link to="/" className="btn-primary">{t('cart.continueShopping')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1 className="cart-title">{t('cart.shoppingCart')}</h1>
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.product._id} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.product.image} alt={item.product.name} />
                </div>
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.product.name}</span>
                  <p className="cart-item-price">{formatCurrency(item.product.price)}</p>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.product._id)}
                    aria-label={t('cart.removeItem')}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                <div className="cart-item-total">{formatCurrency(item.product.price * item.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>{t('cart.orderSummary')}</h3>
            <div className="summary-row">
              <span>{t('cart.subtotal')}</span>
              <span>{formatCurrency(cartTotalPrice)}</span>
            </div>
            <div className="summary-row">
              <span>{t('cart.shipping')}</span>
              <span className="free-shipping">{t('cart.free')}</span>
            </div>
            <div className="summary-total">
              <span>{t('cart.total')}</span>
              <span>{formatCurrency(cartTotalPrice)}</span>
            </div>
            <button className="checkout-btn" onClick={() => navigate('/checkout')}>
              {t('cart.proceedCheckout')} <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <Link to="/" className="continue-shopping">
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
