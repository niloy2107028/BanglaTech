import React from "react";
import { FaShoppingCart, FaUser, FaSearch } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar-custom">
      <div className="container">
        <div className="navbar-content">
          {/* Logo */}
          <div
            className="navbar-brand"
            onClick={() => (window.location.href = "/")}
            style={{ cursor: "pointer" }}
          >
            <h2>
              <span className="bangla-text">Bangla</span>
              <span className="tech-text">Tech</span>
            </h2>
          </div>

          {/* Search Bar */}
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search for products..."
              className="search-input"
            />
          </div>

          {/* Right side items */}
          <div className="navbar-actions">
            <button className="nav-btn">
              <FaUser /> Account
            </button>
            <button className="nav-btn cart-btn">
              <FaShoppingCart />
              <span className="cart-badge">0</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
