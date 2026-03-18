import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./BecomeSeller.css";

const BecomeSeller = () => {
  const [formData, setFormData] = useState({
    shopName: "",
    shopDescription: "",
    address: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, pending, approved, rejected
  const [application, setApplication] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await axios.get("/api/sellers/my-application", { withCredentials: true });
        if (res.data.success && res.data.data) {
          setApplication(res.data.data);
          setStatus(res.data.data.status);
        }
      } catch (err) {
        console.error("Error fetching application:", err);
      }
    };
    fetchApplication();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/api/sellers/apply", formData, { withCredentials: true });
      if (res.data.success) {
        setApplication(res.data.data);
        setStatus("pending");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting application");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === "seller") {
    return (
      <div className="become-seller-page">
        <div className="status-card approved">
          <h2>Congratulations!</h2>
          <p>You are already a registered seller on BanglaMart.</p>
          <button className="btn-primary" onClick={() => navigate("/profile")}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="become-seller-page">
        <div className="status-card pending">
          <h2>Application Under Review</h2>
          <p>Your application for <strong>{application?.shopName}</strong> is being reviewed by our admin team.</p>
          <p>We will notify you once your application is processed.</p>
          <button className="btn-secondary" onClick={() => navigate("/")}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="become-seller-page">
      <div className="become-seller-container">
        <div className="become-seller-header">
          <h1>Start Your Business Journey</h1>
          <p>Fill out the form below to become a verified seller on BanglaMart.</p>
        </div>

        <form onSubmit={handleSubmit} className="become-seller-form">
          <div className="form-group">
            <label>Shop Name</label>
            <input
              type="text"
              name="shopName"
              placeholder="Enter your shop name"
              required
              value={formData.shopName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Shop Description</label>
            <textarea
              name="shopDescription"
              placeholder="Tell us about your products..."
              required
              value={formData.shopDescription}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Business Address</label>
            <input
              type="text"
              name="address"
              placeholder="Full physical address"
              required
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Contact Phone</label>
            <input
              type="tel"
              name="phone"
              placeholder="01xxxxxxxxx"
              required
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BecomeSeller;
