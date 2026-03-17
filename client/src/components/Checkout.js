import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruck, faCreditCard, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

const Checkout = () => {
  const { cart, cartTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    city: "",
    postalCode: "",
    phone: "",
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

      const res = await axios.post("/api/orders", orderData, {
        withCredentials: true,
      });

      if (res.data.success) {
        setOrderSuccess(true);
        clearCart();
        setTimeout(() => {
          navigate("/orders");
        }, 3000);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error placing order");
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="checkout-success">
        <div className="success-card">
          <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for shopping with BanglaMart.</p>
          <p>Redirecting to your order history...</p>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>
        <div className="checkout-layout">
          <div className="checkout-form-section">
            <div className="checkout-card">
              <h3><FontAwesomeIcon icon={faTruck} /> Shipping Information</h3>
              <form onSubmit={handleSubmit} className="shipping-form">
                <div className="form-group">
                  <label>Full Address</label>
                  <textarea
                    name="address"
                    required
                    value={shippingAddress.address}
                    onChange={handleChange}
                    placeholder="House#, Street, Area..."
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={shippingAddress.city}
                      onChange={handleChange}
                      placeholder="e.g. Dhaka"
                    />
                  </div>
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={shippingAddress.postalCode}
                      onChange={handleChange}
                      placeholder="e.g. 1200"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
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
                  <h3><FontAwesomeIcon icon={faCreditCard} /> Payment Method</h3>
                  <div className="payment-option selected">
                    <input type="radio" checked readOnly />
                    <span>Cash on Delivery</span>
                  </div>
                </div>

                <button type="submit" className="place-order-btn" disabled={loading}>
                  {loading ? "Processing..." : "Place Order"}
                </button>
              </form>
            </div>
          </div>

          <div className="checkout-summary-section">
            <div className="checkout-card">
              <h3>Order Summary</h3>
              <div className="checkout-items">
                {cart.items.map((item) => (
                  <div key={item.product._id} className="checkout-item">
                    <span className="item-name">{item.product.name} x {item.quantity}</span>
                    <span className="item-price">৳{(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <span>Total Amount</span>
                <span>৳{cartTotalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
