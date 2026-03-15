import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import ProductList from "./ProductList";
import "./Profile.css";

const ProfilePage = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [ownedProducts, setOwnedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const fetchOwnedProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await axios.get("/api/products/mine", {
          withCredentials: true,
        });
        setOwnedProducts(response.data.data || []);
      } catch (error) {
        console.error("Error fetching seller products:", error);
      } finally {
        setProductsLoading(false);
      }
    };

    if (user) {
      fetchOwnedProducts();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) return <p className="profile-loading">Loading profile...</p>;
  if (!user) return null;

  return (
    <section className="profile-page">
      <div className="profile-card">
        <h2 className="profile-title">My Profile</h2>

        <div className="profile-row">
          <p className="profile-label">Name</p>
          <p className="profile-value">{user.name}</p>
        </div>

        <div className="profile-row">
          <p className="profile-label">Email</p>
          <p className="profile-value">{user.email}</p>
        </div>

        <div className="profile-row">
          <p className="profile-label">Role</p>
          <p className="profile-value profile-role">{user.role}</p>
        </div>

        <button onClick={handleLogout} className="profile-logout-btn">
          Logout
        </button>
      </div>

      <div className="profile-products-wrap">
        {productsLoading ? (
          <p className="profile-loading">Loading your products...</p>
        ) : (
          <ProductList
            title="My Products"
            products={ownedProducts}
            setProducts={setOwnedProducts}
            showOwnerActions={true}
            refreshEndpoint="/api/products/mine"
          />
        )}
      </div>
    </section>
  );
};

export default ProfilePage;
