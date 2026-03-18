import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, applications, users

  useEffect(() => {
    fetchData();
  }, []);

  const stats = {
    totalUsers: users.length,
    pendingApps: applications.filter(a => a.status === "pending").length,
    sellers: users.filter(u => u.role === "seller").length,
    buyers: users.filter(u => u.role === "buyer").length,
    admins: users.filter(u => u.role === "admin").length
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, appsRes] = await Promise.all([
        axios.get("/api/auth/users", { withCredentials: true }),
        axios.get("/api/sellers/applications", { withCredentials: true }),
      ]);
      setUsers(usersRes.data.data);
      setApplications(appsRes.data.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId) => {
    try {
      const res = await axios.put(
        `/api/sellers/applications/${appId}`,
        { status: "approved" },
        { withCredentials: true }
      );
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert("Error approving application");
    }
  };

  const handleReject = async (appId) => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      const res = await axios.put(
        `/api/sellers/applications/${appId}`,
        { status: "rejected", adminMessage: reason },
        { withCredentials: true }
      );
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert("Error rejecting application");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await axios.delete(`/api/auth/users/${userId}`, { withCredentials: true });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert("Error deleting user");
    }
  };

  if (loading) return <div className="admin-loading">Loading management console...</div>;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <h1 className="admin-title">Platform Administration</h1>
          <p className="admin-subtitle">Manage users, applications, and platform settings.</p>
        </header>

        {/* Stats Section */}
        <section className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Apps</div>
            <div className="stat-value highlight">{stats.pendingApps}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Buyers</div>
            <div className="stat-value">{stats.buyers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sellers</div>
            <div className="stat-value">{stats.sellers}</div>
          </div>
        </section>

        <div className="admin-tabs">
          <button 
            className={activeTab === "overview" ? "active" : ""} 
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button 
            className={activeTab === "applications" ? "active" : ""} 
            onClick={() => setActiveTab("applications")}
          >
            Seller Requests ({stats.pendingApps})
          </button>
          <button 
            className={activeTab === "users" ? "active" : ""} 
            onClick={() => setActiveTab("users")}
          >
            User List
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="admin-section overview-section">
            <div className="overview-welcome">
              <h2>Welcome, Administrator</h2>
              <p>Quickly manage pending requests or browse the user list using the tabs above.</p>
            </div>
            {stats.pendingApps > 0 && (
              <div className="alert-banner">
                <span>You have <strong>{stats.pendingApps}</strong> new seller applications waiting for review.</span>
                <button onClick={() => setActiveTab("applications")}>View Requests</button>
              </div>
            )}
          </div>
        )}

        {activeTab === "applications" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Seller Applications</h2>
            </div>
            <div className="apps-grid">
              {applications.length === 0 ? (
                <div className="empty-state">No applications found.</div>
              ) : (
                applications.map(app => (
                  <div key={app._id} className={`app-card ${app.status}`}>
                    <div className="app-card-header">
                      <h3>{app.shopName}</h3>
                      <span className={`status-pill ${app.status}`}>{app.status}</span>
                    </div>
                    <p className="app-desc">{app.shopDescription}</p>
                    <div className="app-meta">
                      <div className="meta-item">
                        <strong>Applicant:</strong> {app.user?.name}
                      </div>
                      <div className="meta-item">
                        <strong>Email:</strong> {app.user?.email}
                      </div>
                      <div className="meta-item">
                        <strong>Contact:</strong> {app.phone}
                      </div>
                      <div className="meta-item">
                        <strong>Location:</strong> {app.address}
                      </div>
                    </div>
                    {app.status === "pending" && (
                      <div className="app-actions-footer">
                        <button className="btn-approve" onClick={() => handleApprove(app._id)}>Approve Store</button>
                        <button className="btn-reject" onClick={() => handleReject(app._id)}>Reject</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Platform User Management</h2>
            </div>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Profile</th>
                    <th>Contact Info</th>
                    <th>Account Role</th>
                    <th>Member Since</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-profile-cell">
                          <span className="user-name">{u.name}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td><span className={`role-pill ${u.role}`}>{u.role}</span></td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn-delete" onClick={() => handleDeleteUser(u._id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
