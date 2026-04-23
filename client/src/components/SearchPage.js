import React, { useEffect, useState } from 'react';
import axios from '../api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ProductList from './ProductList';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const currentQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(currentQuery);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedQuery = query.trim();
      const trimmedCurrentQuery = currentQuery.trim();

      if (trimmedQuery === trimmedCurrentQuery) return;

      if (trimmedQuery) {
        navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`, { replace: true });
      } else {
        navigate('/search', { replace: true });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, currentQuery, navigate]);

  useEffect(() => {
    let ignore = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const response = currentQuery.trim()
          ? await axios.get(`/api/products?search=${encodeURIComponent(currentQuery)}`)
          : await axios.get('/api/products');

        if (!ignore) {
          setProducts(response.data.data || []);
          setSearchMeta(response.data.searchMeta || null);
        }
      } catch (error) {
        if (!ignore) {
          console.error('Error fetching search results:', error);
          setProducts([]);
          setSearchMeta(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      ignore = true;
    };
  }, [currentQuery]);

  useEffect(() => {
    const appliedSearch = currentQuery;
    if (!isAuthenticated || !appliedSearch.trim()) return;

    const trackSearch = async () => {
      try {
        await axios.post(
          '/api/products/recommendations/track-search',
          { search: appliedSearch },
          { withCredentials: true }
        );
      } catch (error) {
        console.error('Error tracking search keywords:', error);
      }
    };

    trackSearch();
  }, [currentQuery, isAuthenticated]);

  const handleClear = () => {
    setQuery('');
    navigate('/search', { replace: true });
  };

  const searchTitle = currentQuery
    ? t('search.titleResults', { query: currentQuery })
    : t('search.titleAll');

  return (
    <div className="search-page">
      <div className="search-page-header">
        <div className="search-page-copy">
          <span className="search-page-badge">{t('search.badge')}</span>
          <h1>{t('search.title')}</h1>
          <p>{t('search.description')}</p>
        </div>

        <div className="search-page-box">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.searchProducts')}
            className="search-page-input"
            autoFocus
          />
          <button onClick={handleClear} className="search-page-clear-btn">
            {t('search.clear')}
          </button>
        </div>

        {currentQuery ? (
          <p className="search-page-label">
            {t('search.showingFor')} <strong>{currentQuery}</strong>
          </p>
        ) : (
          <p className="search-page-label">{t('search.showingAll')}</p>
        )}

        {currentQuery && searchMeta?.didYouMean && (
          <div className="search-correction-banner subtle">
            <p>
              {t('search.didYouMean')}{' '}
              <button
                type="button"
                className="search-correction-link"
                onClick={() => navigate(`/search?q=${encodeURIComponent(searchMeta.didYouMean)}`)}
              >
                {searchMeta.didYouMean}
              </button>
              ?
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <p className="search-page-loading">{t('common.loading')}</p>
      ) : (
        <ProductList
          products={products}
          setProducts={setProducts}
          title={searchTitle}
          refreshEndpoint={
            currentQuery ? `/api/products?search=${encodeURIComponent(currentQuery)}` : '/api/products'
          }
        />
      )}
    </div>
  );
};

export default SearchPage;
