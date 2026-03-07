import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import CategoryView from "./components/CategoryView";
import CategoryManagement from "./components/CategoryManagement";
import Footer from "./components/Footer";
import "./App.css";

function AppRoutes({ products, setProducts }) {
  // const location = useLocation();

  // useEffect(() => {
  //   const handlePopState = () => {
  //     window.location.reload();
  //   };

  //   window.addEventListener("popstate", handlePopState);
  //   return () => window.removeEventListener("popstate", handlePopState);
  // }, []);

  return (
    <>
      <Routes>
        {/* decide which component to show based on URL */}

        <Route
          path="/"
          element={<HomePage products={products} setProducts={setProducts} />}
        />
        <Route
          path="/category/:categoryName"
          // :categoryName is a dynamic parameter.
          element={
            <CategoryView products={products} setProducts={setProducts} />
          }
        />
        <Route path="/admin/categories" element={<CategoryManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        {/* Wildcard Route */}
      </Routes>
    </>
  );
}

function App() {
  // Defines the main App component.
  const [products, setProducts] = useState([]);
  // Declares a state variable products (initially an empty array) and its setter.
  const [loading, setLoading] = useState(true);
  // Declares a state variable loading (initially true) to track loading status.

  useEffect(() => {
    fetchProducts();
    //  When the component loads for the first time
    //  Call fetchProducts()
    //  Get data from the API

    //  We use useEffect to run code after the component renders, like fetching data from an API.
    //  With [] as the dependency array, it runs only once when the component first loads.
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner"></div>
        <p className="app-loading-text">Loading...</p>
      </div>
    );
  }

  // return (
  //   <div className="loading-container">
  //     <div className="spinner"></div>
  //     <p>Loading...</p>
  //   </div>
  // );

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <AppRoutes products={products} setProducts={setProducts} />
        <Footer />
      </div>
    </Router>
  );
}

export default App;
