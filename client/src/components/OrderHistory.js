import React, { useState, useEffect } from 'react';
import axios from '../api';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faClock, faCheckCircle, faTruck, faTimesCircle, faXmark, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import './OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedOrderIds, setDismissedOrderIds] = useState(
    () => new Set(JSON.parse(localStorage.getItem('buyer_dismissed_orders') || '[]'))
  );
  const { t, formatCurrency, formatDate, translateOrderStatus } = useLanguage();

  const isOrderClearable = (order) =>
    Array.isArray(order.orderItems) &&
    order.orderItems.length > 0 &&
    order.orderItems.every(item => item.status === 'Delivered' || item.status === 'Cancelled');

  const dismissOrder = (orderId) => {
    setDismissedOrderIds(prev => {
      const next = new Set([...prev, orderId]);
      localStorage.setItem('buyer_dismissed_orders', JSON.stringify([...next]));
      return next;
    });
  };

  const clearAllOrders = () => {
    const clearableIds = orders.filter(isOrderClearable).map(o => o._id);
    setDismissedOrderIds(prev => {
      const next = new Set([...prev, ...clearableIds]);
      localStorage.setItem('buyer_dismissed_orders', JSON.stringify([...next]));
      return next;
    });
  };

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

  const visibleOrders = orders.filter(o => !dismissedOrderIds.has(o._id));
  const clearableVisible = visibleOrders.filter(isOrderClearable);

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-title-row">
          <h1 className="orders-title">{t('orders.title')}</h1>
          {clearableVisible.length > 0 && (
            <button type="button" className="orders-clear-all-btn" onClick={clearAllOrders}>
              <FontAwesomeIcon icon={faTrash} /> Clear All
            </button>
          )}
        </div>
        {visibleOrders.length === 0 ? (
          <div className="orders-empty">
            <p>{orders.length === 0 ? t('orders.empty') : t('orders.allCleared', {}, 'All orders have been cleared.')}</p>
            <Link to="/" className="btn-primary">{t('orders.startShopping')}</Link>
          </div>
        ) : (
          <div className="orders-list">
            {visibleOrders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-id">{t('orders.order')} #{order._id.slice(-8).toUpperCase()}</span>
                    <span className="order-date">{t('orders.placedOn')} {formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-header-right">
                    <div
                      className="order-status"
                      style={{ backgroundColor: `${getStatusColor(order.status)}15`, color: getStatusColor(order.status) }}
                    >
                      <FontAwesomeIcon icon={getStatusIcon(order.status)} /> {translateOrderStatus(order.status)}
                    </div>
                    {isOrderClearable(order) && (
                      <button
                        type="button"
                        className="order-dismiss-btn"
                        onClick={() => dismissOrder(order._id)}
                        title="Remove from history"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    )}
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
                        </div>
                        {item.status === 'Cancelled' && item.cancellationReason && (
                          <div className="item-cancellation-msg">
                            <strong>{t('orders.cancellationNote')}</strong> {item.cancellationReason}
                          </div>
                        )}
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
