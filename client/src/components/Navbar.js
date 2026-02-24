import React from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart, FaUser, FaSearch, FaCog } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar-custom">
      <div className="container">
        <div className="navbar-content">
          {/* Logo */}
          <Link
            to="/"
            className="navbar-brand"
            style={{ textDecoration: "none" }}
          >
            <h2>
              <span className="bangla-text">Bangla</span>
              <span className="mart-text">Mart</span>
            </h2>
          </Link>

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
            <Link to="/admin/categories" className="nav-btn">
              <FaCog /> Manage Categories
            </Link>
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
