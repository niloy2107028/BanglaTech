import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faCartShopping,
  faCamera,
  faGear,
  faMagnifyingGlass,
  faMoon,
  faRightFromBracket,
  faStore,
  faSun,
  faUser,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { cartItemsCount } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedQuery = searchQuery.trim();
      const trimmedCurrentQuery = currentQuery.trim();

      if (!trimmedQuery) {
        if (location.pathname === '/search' && trimmedCurrentQuery) {
          navigate('/search', { replace: true });
        }
        return;
      }

      if (location.pathname === '/search' && trimmedQuery === trimmedCurrentQuery) {
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const handleImageSearchSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    navigate('/image-search', {
      state: {
        imageSearchUpload: {
          file,
          prompt: searchQuery.trim(),
          fileName: file.name || 'image',
        },
      },
    });

    if (event.target) {
      event.target.value = '';
    }
  };

  const languageToggle = (
    <div className="navbar-language-toggle" aria-label={t('common.language')}>
      <button
        type="button"
        className={language === 'en' ? 'active' : ''}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={language === 'bn' ? 'active' : ''}
        onClick={() => setLanguage('bn')}
      >
        বাং
      </button>
    </div>
  );

  const themeToggle = (
    <button
      type="button"
      className={`navbar-button navbar-theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
      onClick={toggleTheme}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
      <span>{isDarkMode ? 'Light' : 'Dark'}</span>
    </button>
  );

  const actionItems = (
    <>
      {languageToggle}
      {themeToggle}

      {!loading && isAuthenticated && user?.role === 'admin' && (
        <>
          <Link to="/admin/dashboard" className="navbar-button">
            <FontAwesomeIcon icon={faGear} /> <span>{t('common.dashboard')}</span>
          </Link>
          <Link to="/admin/categories" className="navbar-button">
            <FontAwesomeIcon icon={faGear} /> <span>{t('navbar.categories')}</span>
          </Link>
          <Link to="/store" className="navbar-button visit-site-nav-btn">
            <span>{t('navbar.visitSite')}</span>
          </Link>
        </>
      )}

      {!loading && isAuthenticated && user?.role === 'seller' && (
        <Link to="/seller/orders" className="navbar-button">
          <FontAwesomeIcon icon={faStore} /> <span>{t('navbar.sellerHub', {}, 'Seller Hub')}</span>
        </Link>
      )}

      {!loading && isAuthenticated && user?.role === 'buyer' && (
        <>
          <Link to="/orders" className="navbar-button">
            <span>{t('navbar.myOrders')}</span>
          </Link>
          <Link to="/become-seller" className="navbar-button">
            <span>{t('navbar.becomeSeller')}</span>
          </Link>
        </>
      )}

      {!loading && !isAuthenticated && (
        <>
          <Link to="/login" className="navbar-button">
            <FontAwesomeIcon icon={faUser} /> <span>{t('navbar.login')}</span>
          </Link>
          <Link to="/register" className="navbar-button">
            <FontAwesomeIcon icon={faUser} /> <span>{t('navbar.register')}</span>
          </Link>
        </>
      )}

      {!loading && isAuthenticated && (
        <>
          <Link to="/profile" className="navbar-button">
            <FontAwesomeIcon icon={faUser} /> <span>{t('navbar.account')}</span>
          </Link>
          <button onClick={handleLogout} className="navbar-button navbar-logout-btn">
            <FontAwesomeIcon icon={faRightFromBracket} /> <span>{t('navbar.logout')}</span>
          </button>
        </>
      )}

      {(!isAuthenticated || user?.role === 'buyer') && (
        <Link to="/cart" className="navbar-button" aria-label="cart">
          <FontAwesomeIcon icon={faCartShopping} />
          {cartItemsCount > 0 && <span className="navbar-cart-badge">{cartItemsCount}</span>}
        </Link>
      )}
    </>
  );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <Link to="/" className="navbar-logo">
            <h2>
              <span className="navbar-logo-bangla">Bangla</span>
              <span className="navbar-logo-mart">Mart</span>
            </h2>
          </Link>

          <div className="navbar-search-wrapper">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="navbar-search-icon" />
            <input
              type="text"
              placeholder={t('navbar.searchPlaceholder')}
              className="navbar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              className="navbar-image-search-btn"
              onClick={openImagePicker}
              aria-label="Image search"
              title="Search by image"
            >
              <FontAwesomeIcon icon={faCamera} />
            </button>
            <input
              ref={imageInputRef}
            type="file"
            accept="image/*"
            className="navbar-hidden-file-input"
            onChange={handleImageSearchSelect}
          />
          </div>

          <div className="navbar-actions navbar-actions-desktop">{actionItems}</div>

          <button
            className="navbar-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label={t('navbar.openMenu')}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="navbar-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`navbar-mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="navbar-mobile-header">
          <h3>{t('common.menu')}</h3>
          <button
            className="navbar-mobile-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label={t('navbar.closeMenu')}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="navbar-mobile-search">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="navbar-search-icon" />
          <input
            type="text"
            placeholder={t('navbar.searchPlaceholder')}
            className="navbar-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            className="navbar-image-search-btn"
            onClick={openImagePicker}
            aria-label="Image search"
            title="Search by image"
          >
            <FontAwesomeIcon icon={faCamera} />
          </button>
        </div>

        <div className="navbar-mobile-actions">{actionItems}</div>
      </aside>
    </nav>
  );
};

export default Navbar;
