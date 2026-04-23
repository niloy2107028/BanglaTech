import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faCreditCard, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import './Checkout.css';

const Checkout = () => {
  const { cart, cartTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { t, formatCurrency } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  const handleChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        orderItems: cart.items.map((item) => ({
          name: item.product.name,
          qty: item.quantity,
          image: item.product.image,
          price: item.product.price,
          product: item.product._id,
        })),
        shippingAddress,
        totalPrice: cartTotalPrice,
      };

      const res = await axios.post('/api/orders', orderData, {
        withCredentials: true,
      });

      if (res.data.success) {
        setOrderSuccess(true);
        clearCart();
        setTimeout(() => {
          navigate('/orders');
        }, 3000);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="checkout-success">
        <div className="success-card">
          <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
          <h2>{t('checkout.successTitle')}</h2>
          <p>{t('checkout.successLine1')}</p>
          <p>{t('checkout.successLine2')}</p>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">{t('checkout.title')}</h1>
        <div className="checkout-layout">
          <div className="checkout-form-section">
            <div className="checkout-card">
              <h3><FontAwesomeIcon icon={faTruck} /> {t('checkout.shippingInfo')}</h3>
              <form onSubmit={handleSubmit} className="shipping-form">
                <div className="form-group">
                  <label>{t('checkout.fullAddress')}</label>
                  <textarea
                    name="address"
                    required
                    value={shippingAddress.address}
                    onChange={handleChange}
                    placeholder={t('checkout.addressPlaceholder')}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('checkout.city')}</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={shippingAddress.city}
                      onChange={handleChange}
                      placeholder={t('checkout.cityPlaceholder')}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('checkout.postalCode')}</label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={shippingAddress.postalCode}
                      onChange={handleChange}
                      placeholder={t('checkout.postalPlaceholder')}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('checkout.phoneNumber')}</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={shippingAddress.phone}
                    onChange={handleChange}
                    placeholder="01xxxxxxxxx"
                  />
                </div>

                <div className="payment-method">
                  <h3><FontAwesomeIcon icon={faCreditCard} /> {t('checkout.paymentMethod')}</h3>
                  <div className="payment-option selected">
                    <input type="radio" checked readOnly />
                    <span>{t('checkout.cashOnDelivery')}</span>
                  </div>
                </div>

                <button type="submit" className="place-order-btn" disabled={loading}>
                  {loading ? t('checkout.processing') : t('checkout.placeOrder')}
                </button>
              </form>
            </div>
          </div>

          <div className="checkout-summary-section">
            <div className="checkout-card">
              <h3>{t('checkout.summary')}</h3>
              <div className="checkout-items">
                {cart.items.map((item) => (
                  <div key={item.product._id} className="checkout-item">
                    <span className="item-name">{item.product.name} x {item.quantity}</span>
                    <span className="item-price">{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <span>{t('checkout.totalAmount')}</span>
                <span>{formatCurrency(cartTotalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
