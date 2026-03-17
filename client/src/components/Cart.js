import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus, faMinus, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../context/CartContext";
import "./Cart.css";

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, cartTotalPrice } = useCart();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-content">
          <h2>Your cart is empty</h2>
          <p>Add some products to your cart to see them here.</p>
          <Link to="/" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1 className="cart-title">Shopping Cart</h1>
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.product._id} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.product.image} alt={item.product.name} />
                </div>
                <div className="cart-item-info">
                  <Link to={`/product/${item.product._id}`} className="cart-item-name">
                    {item.product.name}
                  </Link>
                  <p className="cart-item-price">৳{item.product.price.toLocaleString()}</p>
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
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                <div className="cart-item-total">
                  ৳{(item.product.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>৳{cartTotalPrice.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-shipping">Free</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>৳{cartTotalPrice.toLocaleString()}</span>
            </div>
            <button
              className="checkout-btn"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <Link to="/" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
