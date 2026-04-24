import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import CategoryView from './components/CategoryView';
import CategoryManagement from './components/CategoryManagement';
import SearchPage from './components/SearchPage';
import Footer from './components/Footer';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProfilePage from './components/Profile';
import ForgotPassword from './components/ForgotPassword';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import OrderHistory from './components/OrderHistory';
import SellerOrders from './components/SellerOrders';
import BecomeSeller from './components/BecomeSeller';
import AdminDashboard from './components/AdminDashboard';
import Chatbot from './components/Chatbot';
import ProductDetails from './components/ProductDetails';
import ForYouPage from './components/ForYouPage';

import './App.css';

function AppRoutes() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner"></div>
        <p className="app-loading-text">{t('common.loadingExperience')}</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <HomePage />
        }
      />
      <Route path="/store" element={<HomePage />} />
      <Route path="/category/:categoryName" element={<CategoryView />} />
      <Route path="/for-you" element={<ForYouPage />} />
      <Route path="/product/:id" element={<ProductDetails />} />
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
      <Route path="/image-search" element={<SearchPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <div className="app-shell">
                <Navbar />
                <main className="main-content">
                  <AppRoutes />
                </main>
                <Chatbot />
                <Footer />
              </div>
            </Router>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
