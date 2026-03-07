import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faUser,
  faMagnifyingGlass,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <h2>
              <span className="navbar-logo-bangla">Bangla</span>
              <span className="navbar-logo-mart">Mart</span>
            </h2>
          </Link>

          {/* Search Bar */}
          <div className="navbar-search-wrapper">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="navbar-search-icon"
            />
            <input
              type="text"
              placeholder="Search for products..."
              className="navbar-search-input"
            />
          </div>

          {/* Right side items */}
          <div className="navbar-actions">
            <Link to="/admin/categories" className="navbar-button">
              <FontAwesomeIcon icon={faGear} /> <span>Manage Categories</span>
            </Link>
            <button className="navbar-button">
              <FontAwesomeIcon icon={faUser} /> <span>Account</span>
            </button>
            <button className="navbar-button">
              <FontAwesomeIcon icon={faCartShopping} />
              <span className="navbar-cart-badge">0</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
