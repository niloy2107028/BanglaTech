import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faClock, faCheckCircle, faTruck, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import "./OrderHistory.css";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/orders/myorders", {
        withCredentials: true,
      });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId, productId) => {
    const reason = prompt("Please tell us why you want to cancel this order:");
    if (reason === null) return;

    try {
      const res = await axios.put(
        `/api/orders/${orderId}/item/${productId}/cancel`,
        { reason },
        { withCredentials: true }
      );
      if (res.data.success) {
        alert("Order item cancelled successfully.");
        fetchOrders();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error cancelling order");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending": return faClock;
      case "Processing": return faBox;
      case "Shipped": return faTruck;
      case "Delivered": return faCheckCircle;
      case "Cancelled": return faTimesCircle;
      default: return faBox;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "#f59e0b";
      case "Processing": return "#3b82f6";
      case "Shipped": return "#8b5cf6";
      case "Delivered": return "#10b981";
      case "Cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return <div className="orders-loading">Loading your orders...</div>;
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <h1 className="orders-title">Order History</h1>
        {orders.length === 0 ? (
          <div className="orders-empty">
            <p>You haven't placed any orders yet.</p>
            <Link to="/" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-id">Order #{order._id.slice(-8).toUpperCase()}</span>
                    <span className="order-date">Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div 
                    className="order-status" 
                    style={{ backgroundColor: getStatusColor(order.status) + "15", color: getStatusColor(order.status) }}
                  >
                    <FontAwesomeIcon icon={getStatusIcon(order.status)} /> {order.status}
                  </div>
                </div>
                <div className="order-items">
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <img src={item.image} alt={item.name} className="item-img" />
                      <div className="item-details">
                        <div className="item-main-info">
                          <span className="item-name">{item.name}</span>
                          {item.status === "Pending" && (
                            <button 
                              className="cancel-item-btn"
                              onClick={() => handleCancelOrder(order._id, item.product)}
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                        <div className="item-meta">
                          <span className="item-qty-price">{item.qty} x ৳{item.price.toLocaleString()}</span>
                          {item.status === "Cancelled" && item.cancellationReason && (
                            <div className="item-cancellation-msg">
                              <strong>Cancellation Note:</strong> {item.cancellationReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-footer">
                  <div className="order-address">
                    <strong>Shipping to:</strong>
                    <p>{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                  </div>
                  <div className="order-total">
                    <span>Total Paid</span>
                    <span className="total-amount">৳{order.totalPrice.toLocaleString()}</span>
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
