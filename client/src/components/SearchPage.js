import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductList from "./ProductList";
import "./SearchPage.css";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(currentQuery);
  //page load er por jate input e value thake
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Keep local input synced with URL query
  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  // Debounce typing before updating URL
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedQuery = query.trim();
      const trimmedCurrentQuery = currentQuery.trim();
      //   2 ta same na cz query input er sathe change koy fast
      //   currentQuery update hoy search er por

      // Avoid navigating if URL already has the same query
      //   apple search kore aschi abr jodi apple search kori like space diye space katle
      if (trimmedQuery === trimmedCurrentQuery) {
        return;
      }

      if (trimmedQuery) {
        navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`, {
          replace: true,
        });
      } else {
        navigate("/search", { replace: true });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, currentQuery, navigate]);

  // Fetch products from URL query
  useEffect(() => {
    let ignore = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        let response;

        if (currentQuery.trim()) {
          response = await axios.get(
            `/api/products?search=${encodeURIComponent(currentQuery)}`,
          );
        } else {
          response = await axios.get("/api/products");
        }

        if (!ignore) {
          setProducts(response.data.data);
        }
      } catch (error) {
        if (!ignore) {
          console.error("Error fetching search results:", error);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      ignore = true;
    };
  }, [currentQuery]);

  const handleClear = () => {
    setQuery("");
    navigate("/search", { replace: true });
  };

  return (
    <div className="search-page">
      <div className="search-page-header">
        <div className="search-page-box">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products..."
            className="search-page-input"
            autoFocus
          />
          <button onClick={handleClear} className="search-page-clear-btn">
            ✕ Clear
          </button>
        </div>

        {currentQuery ? (
          <p className="search-page-label">
            Showing results for: <strong>"{currentQuery}"</strong>
          </p>
        ) : (
          <p className="search-page-label">Showing all products</p>
        )}
      </div>

      {loading ? (
        <p className="search-page-loading">Loading...</p>
      ) : (
        <ProductList
          products={products}
          setProducts={setProducts}
          title={
            currentQuery ? `Results for "${currentQuery}"` : "All Products"
          }
        />
      )}
    </div>
  );
};

export default SearchPage;
