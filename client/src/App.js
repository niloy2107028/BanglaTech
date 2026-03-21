import { useState, useEffect } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import X from "./X";

import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import CategoryView from "./components/CategoryView";
import CategoryManagement from "./components/CategoryManagement";
import SearchPage from "./components/SearchPage";
import Footer from "./components/Footer";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ProfilePage from "./components/Profile";
import ForgotPassword from "./components/ForgotPassword";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import OrderHistory from "./components/OrderHistory";
import SellerOrders from "./components/SellerOrders";
import BecomeSeller from "./components/BecomeSeller";
import AdminDashboard from "./components/AdminDashboard";
import Chatbot from "./components/Chatbot";

import "./App.css";

function AppRoutes({ products, setProducts }) {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <>
      <Routes>
        {/* Admin Dashboard is at /admin/dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* If Admin, Redirect / to /admin/dashboard. Otherwise, show HomePage. */}
        <Route 
          path="/" 
          element={
            user?.role === "admin" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <HomePage />
            )
          } 
        />
        
        {/* Explicit route for the store/public view for everyone, including Admin */}
        <Route path="/store" element={<HomePage />} />
        
        <Route
          path="/category/:categoryName"
          element={
            <CategoryView products={products} setProducts={setProducts} />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute requiredRole="buyer">
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute requiredRole="buyer">
              <OrderHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/become-seller"
          element={
            <ProtectedRoute requiredRole="buyer">
              <BecomeSeller />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute requiredRole="admin">
              <CategoryManagement />
            </ProtectedRoute>
          }
        />
        <Route path="/search" element={<SearchPage />} />
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
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <AppRoutes products={products} setProducts={setProducts} />
            </main>
            <Chatbot />
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
