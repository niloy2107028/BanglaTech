import React, { useState, useEffect } from 'react';
import axios from '../api';
import { useLanguage } from '../context/LanguageContext';
import './SellerOrders.css';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, formatDate, translateOrderStatus } = useLanguage();

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const fetchSellerOrders = async () => {
    try {
      const res = await axios.get('/api/orders/seller', { withCredentials: true });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching seller orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, productId, newStatus) => {
    let cancellationReason = '';
    if (newStatus === 'Cancelled') {
      cancellationReason = prompt(t('sellerOrders.cancelPrompt'));
      if (cancellationReason === null) return;
      if (!cancellationReason.trim()) {
        alert(t('sellerOrders.cancelReasonRequired'));
        return;
      }
    }

    try {
      const res = await axios.put(
        `/api/orders/${orderId}/item/${productId}/status`,
        { status: newStatus, cancellationReason },
        { withCredentials: true }
      );
      if (res.data.success) {
        fetchSellerOrders();
      }
    } catch (error) {
      alert(error.response?.data?.message || t('sellerOrders.updateError'));
    }
  };

  const getAvailableStatuses = (currentStatus) => {
    const allStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const statusOrder = ['Pending', 'Processing', 'Shipped', 'Delivered'];

    if (currentStatus === 'Cancelled') return ['Cancelled'];
    if (currentStatus === 'Delivered') return ['Delivered'];

    const currentIndex = statusOrder.indexOf(currentStatus);
    const available = statusOrder.slice(currentIndex);
    if (currentIndex <= 1) available.push('Cancelled');
    return available;
  };

  if (loading) return <div className="seller-orders-loading">{t('sellerOrders.loading')}</div>;

  return (
    <div className="seller-orders-page">
      <div className="seller-orders-container">
        <h1 className="seller-orders-title">{t('sellerOrders.title')}</h1>
        {orders.length === 0 ? (
          <div className="seller-orders-empty">{t('sellerOrders.empty')}</div>
        ) : (
          <div className="seller-orders-list">
            {orders.map((order) => (
              <div key={order._id} className="seller-order-card">
                <div className="seller-order-header">
                  <div className="customer-info">
                    <span className="order-id">{t('orders.order')} #{order._id.slice(-8).toUpperCase()}</span>
                    <span className="customer-details">{t('sellerOrders.customer')}: {order.shippingAddress.phone}</span>
                  </div>
                  <div className="order-date">{formatDate(order.createdAt)}</div>
                </div>

                <div className="seller-order-items">
                  {order.orderItems.map((item) => (
                    <div key={item.product} className="seller-item">
                      <img src={item.image} alt={item.name} className="item-img" />
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-qty">{t('sellerOrders.quantity')}: {item.qty}</span>
                      </div>
                      <div className="item-status-actions">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusUpdate(order._id, item.product, e.target.value)}
                          className={`status-select status-${item.status.toLowerCase()}`}
                          disabled={item.status === 'Delivered' || item.status === 'Cancelled'}
                        >
                          {getAvailableStatuses(item.status).map((status) => (
                            <option key={status} value={status}>{translateOrderStatus(status)}</option>
                          ))}
                        </select>
                      </div>
                      {item.status === 'Cancelled' && item.cancellationReason && (
                        <div className="cancellation-info">{t('sellerOrders.reason')}: {item.cancellationReason}</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="seller-order-footer">
                  <div className="shipping-address">
                    <strong>{t('sellerOrders.shippingAddress')}</strong>
                    <p>{order.shippingAddress.address}, {order.shippingAddress.city} - {order.shippingAddress.postalCode}</p>
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

export default SellerOrders;
