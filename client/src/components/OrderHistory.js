import React, { useState, useEffect } from 'react';
import axios from '../api';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faClock, faCheckCircle, faTruck, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import './OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, formatCurrency, formatDate, translateOrderStatus } = useLanguage();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/orders/myorders', { withCredentials: true });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId, productId) => {
    const reason = prompt(t('orders.cancelPrompt'));
    if (reason === null) return;

    try {
      const res = await axios.put(
        `/api/orders/${orderId}/item/${productId}/cancel`,
        { reason },
        { withCredentials: true }
      );
      if (res.data.success) {
        alert(t('orders.cancelSuccess'));
        fetchOrders();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling order');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return faClock;
      case 'Processing': return faBox;
      case 'Shipped': return faTruck;
      case 'Delivered': return faCheckCircle;
      case 'Cancelled': return faTimesCircle;
      default: return faBox;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#f59e0b';
      case 'Processing': return '#3b82f6';
      case 'Shipped': return '#8b5cf6';
      case 'Delivered': return '#10b981';
      case 'Cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <div className="orders-loading">{t('orders.loadingOrders')}</div>;
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <h1 className="orders-title">{t('orders.title')}</h1>
        {orders.length === 0 ? (
          <div className="orders-empty">
            <p>{t('orders.empty')}</p>
            <Link to="/" className="btn-primary">{t('orders.startShopping')}</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-id">{t('orders.order')} #{order._id.slice(-8).toUpperCase()}</span>
                    <span className="order-date">{t('orders.placedOn')} {formatDate(order.createdAt)}</span>
                  </div>
                  <div
                    className="order-status"
                    style={{ backgroundColor: `${getStatusColor(order.status)}15`, color: getStatusColor(order.status) }}
                  >
                    <FontAwesomeIcon icon={getStatusIcon(order.status)} /> {translateOrderStatus(order.status)}
                  </div>
                </div>
                <div className="order-items">
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <img src={item.image} alt={item.name} className="item-img" />
                      <div className="item-details">
                        <div className="item-main-info">
                          <span className="item-name">{item.name}</span>
                          {item.status === 'Pending' && (
                            <button className="cancel-item-btn" onClick={() => handleCancelOrder(order._id, item.product)}>
                              {t('orders.cancelOrder')}
                            </button>
                          )}
                        </div>
                        <div className="item-meta">
                          <span className="item-qty-price">{item.qty} x {formatCurrency(item.price)}</span>
                          {item.status === 'Cancelled' && item.cancellationReason && (
                            <div className="item-cancellation-msg">
                              <strong>{t('orders.cancellationNote')}</strong> {item.cancellationReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-footer">
                  <div className="order-address">
                    <strong>{t('orders.shippingTo')}</strong>
                    <p>{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                  </div>
                  <div className="order-total">
                    <span>{t('orders.totalPaid')}</span>
                    <span className="total-amount">{formatCurrency(order.totalPrice)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
