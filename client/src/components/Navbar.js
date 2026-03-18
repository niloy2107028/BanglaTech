import React, { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
// Link — For Normal Navigation in UI
// Use useNavigate when navigation happens after some logic.
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faUser,
  faMagnifyingGlass,
  faGear,
  faBars,
  faXmark,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { cartItemsCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const currentQuery = searchParams.get("q") || "";

  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedQuery = searchQuery.trim();
      // console.log("check2 :" + trimmedQuery);
      const trimmedCurrentQuery = currentQuery.trim();
      // console.log("check1: " + currentQuery);
      // console.log("check3 :" + trimmedCurrentQuery);

      // If input is empty and user is already on search page,
      // keep the page on /search so all products can be shown.
      if (!trimmedQuery) {
        if (location.pathname === "/search" && trimmedCurrentQuery) {
          navigate("/search", { replace: true });
          // replace true mane : current page ke replace korba
          // reason : back korle jate privious search e chole na jay
        }
        return;
      }

      // home page theke search hoye search page e ashle search page eo navbar ase so 2nd time o run hbe , 2nd run prevent er jonno
      if (
        location.pathname === "/search" &&
        trimmedQuery === trimmedCurrentQuery
      ) {
        return;
      }

      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`, {
        replace: true,
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentQuery, location.pathname, navigate]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const actionItems = (
    <>
      {/* Admin specific links */}
      {!loading && isAuthenticated && user?.role === "admin" && (
        <>
          <Link to="/" className="navbar-button">
            <FontAwesomeIcon icon={faGear} /> <span>Dashboard</span>
          </Link>
          <Link to="/admin/categories" className="navbar-button">
            <FontAwesomeIcon icon={faGear} /> <span>Categories</span>
          </Link>
          <Link to="/store" className="navbar-button visit-site-nav-btn">
            <span>Visit Site</span>
          </Link>
        </>
      )}

      {/* Seller specific links */}
      {!loading && isAuthenticated && user?.role === "seller" && (
        <>
          <Link to="/seller/orders" className="navbar-button">
            <FontAwesomeIcon icon={faCartShopping} /> <span>Store Orders</span>
          </Link>
        </>
      )}

      {/* Buyer specific links */}
      {!loading && isAuthenticated && user?.role === "buyer" && (
        <>
          <Link to="/orders" className="navbar-button">
            <span>My Orders</span>
          </Link>
          <Link to="/become-seller" className="navbar-button">
            <span>Become Seller</span>
          </Link>
        </>
      )}

      {!loading && !isAuthenticated && (
        <>
          <Link to="/login" className="navbar-button">
            <FontAwesomeIcon icon={faUser} /> <span>Login</span>
          </Link>
          <Link to="/register" className="navbar-button">
            <FontAwesomeIcon icon={faUser} /> <span>Register</span>
          </Link>
        </>
      )}

      {!loading && isAuthenticated && (
        <>
          <Link to="/profile" className="navbar-button">
            <FontAwesomeIcon icon={faUser} /> <span>Account</span>
          </Link>
          <button onClick={handleLogout} className="navbar-button navbar-logout-btn">
            <FontAwesomeIcon icon={faSignOutAlt} /> <span>Logout</span>
          </button>
        </>
      )}

      {/* Only show cart for buyers and guests */}
      {(!isAuthenticated || user?.role === "buyer") && (
        <Link to="/cart" className="navbar-button">
          <FontAwesomeIcon icon={faCartShopping} />
          {cartItemsCount > 0 && (
            <span className="navbar-cart-badge">{cartItemsCount}</span>
          )}
        </Link>
      )}
    </>
  );

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

          {/* Search Bar - Always visible */}
          <div className="navbar-search-wrapper">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="navbar-search-icon"
            />
            <input
              type="text"
              placeholder="Search for products..."
              className="navbar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Right side items */}
          <div className="navbar-actions navbar-actions-desktop">
            {actionItems}
          </div>

          <button
            className="navbar-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="navbar-mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`navbar-mobile-drawer ${isMobileMenuOpen ? "open" : ""}`}
      >
        <div className="navbar-mobile-header">
          <h3>Menu</h3>
          <button
            className="navbar-mobile-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Mobile Search Bar - Always visible */}
        <div className="navbar-mobile-search">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="navbar-search-icon"
          />
          <input
            type="text"
            placeholder="Search for products..."
            className="navbar-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="navbar-mobile-actions">{actionItems}</div>
      </aside>
    </nav>
  );
};

export default Navbar;
