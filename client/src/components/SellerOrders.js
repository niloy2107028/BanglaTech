import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faClock, faTruck, faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import "./SellerOrders.css";

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const fetchSellerOrders = async () => {
    try {
      const res = await axios.get("/api/orders/seller", { withCredentials: true });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching seller orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, productId, newStatus, currentStatus) => {
    // If status is Cancelled, ask for reason
    let cancellationReason = "";
    if (newStatus === "Cancelled") {
      cancellationReason = prompt("Please enter a reason for cancelling this order:");
      if (cancellationReason === null) return; // User clicked cancel on prompt
      if (!cancellationReason.trim()) {
        alert("Cancellation reason is required.");
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
        fetchSellerOrders(); // Refresh data
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error updating status");
    }
  };

  const getAvailableStatuses = (currentStatus) => {
    const allStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
    const statusOrder = ["Pending", "Processing", "Shipped", "Delivered"];
    
    if (currentStatus === "Cancelled") return ["Cancelled"];
    if (currentStatus === "Delivered") return ["Delivered"];

    const currentIndex = statusOrder.indexOf(currentStatus);
    
    // Only allow next steps and Cancelled
    const available = statusOrder.slice(currentIndex);
    
    // Can only cancel if Pending or Processing
    if (currentIndex <= 1) {
      available.push("Cancelled");
    }
    
    return available;
  };

  if (loading) return <div className="seller-orders-loading">Loading vendor orders...</div>;

  return (
    <div className="seller-orders-page">
      <div className="seller-orders-container">
        <h1 className="seller-orders-title">Manage Vendor Orders</h1>
        {orders.length === 0 ? (
          <div className="seller-orders-empty">No orders found for your products.</div>
        ) : (
          <div className="seller-orders-list">
            {orders.map((order) => (
              <div key={order._id} className="seller-order-card">
                <div className="seller-order-header">
                  <div className="customer-info">
                    <span className="order-id">Order #{order._id.slice(-8).toUpperCase()}</span>
                    <span className="customer-details">
                      Customer: {order.shippingAddress.phone}
                    </span>
                  </div>
                  <div className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="seller-order-items">
                  {order.orderItems.map((item) => (
                    <div key={item.product} className="seller-item">
                      <img src={item.image} alt={item.name} className="item-img" />
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-qty">Quantity: {item.qty}</span>
                      </div>
                      <div className="item-status-actions">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusUpdate(order._id, item.product, e.target.value, item.status)}
                          className={`status-select status-${item.status.toLowerCase()}`}
                          disabled={item.status === "Delivered" || item.status === "Cancelled"}
                        >
                          {getAvailableStatuses(item.status).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      {item.status === "Cancelled" && item.cancellationReason && (
                        <div className="cancellation-info">
                          Reason: {item.cancellationReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="seller-order-footer">
                  <div className="shipping-address">
                    <strong>Shipping Address:</strong>
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
