import React, { useState, useEffect } from 'react';
import axios from '../api';
import { useLanguage } from '../context/LanguageContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [salesStats, setSalesStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { t, formatDate } = useLanguage();

  useEffect(() => {
    fetchData();
  }, []);

  const stats = {
    totalUsers: users.length,
    pendingApps: applications.filter((a) => a.status === 'pending').length,
    sellers: users.filter((u) => u.role === 'seller').length,
    buyers: users.filter((u) => u.role === 'buyer').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, appsRes, salesRes] = await Promise.all([
        axios.get('/api/auth/users', { withCredentials: true }),
        axios.get('/api/sellers/applications', { withCredentials: true }),
        axios.get('/api/orders/admin/sales-stats', { withCredentials: true }),
      ]);
      setUsers(usersRes.data.data || []);
      setApplications(appsRes.data.data || []);
      setSalesStats(salesRes.data.data || null);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId) => {
    try {
      const res = await axios.put(
        `/api/sellers/applications/${appId}`,
        { status: 'approved' },
        { withCredentials: true }
      );
      if (res.data.success) fetchData();
    } catch (err) {
      alert(t('admin.approveError'));
    }
  };

  const handleReject = async (appId) => {
    const reason = prompt(t('admin.rejectPrompt'));
    if (reason === null) return;
    try {
      const res = await axios.put(
        `/api/sellers/applications/${appId}`,
        { status: 'rejected', adminMessage: reason },
        { withCredentials: true }
      );
      if (res.data.success) fetchData();
    } catch (err) {
      alert(t('admin.rejectError'));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('admin.deleteUserPrompt'))) return;
    try {
      const res = await axios.delete(`/api/auth/users/${userId}`, { withCredentials: true });
      if (res.data.success) fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || t('admin.deleteUserError'));
    }
  };

  if (loading) return <div className="admin-loading">{t('admin.loading')}</div>;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <h1 className="admin-title">{t('admin.title')}</h1>
          <p className="admin-subtitle">{t('admin.subtitle')}</p>
        </header>

        <section className="admin-stats-grid">
          <div className="stat-card"><div className="stat-label">{t('admin.totalUsers')}</div><div className="stat-value">{stats.totalUsers}</div></div>
          <div className="stat-card"><div className="stat-label">{t('admin.pendingApps')}</div><div className="stat-value highlight">{stats.pendingApps}</div></div>
          <div className="stat-card"><div className="stat-label">{t('admin.buyers')}</div><div className="stat-value">{stats.buyers}</div></div>
          <div className="stat-card"><div className="stat-label">{t('admin.sellers')}</div><div className="stat-value">{stats.sellers}</div></div>
        </section>

        <div className="admin-tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>{t('admin.overview')}</button>
          <button className={activeTab === 'applications' ? 'active' : ''} onClick={() => setActiveTab('applications')}>{t('admin.sellerRequests')} ({stats.pendingApps})</button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>{t('admin.userList')}</button>
          <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>Sales Analytics</button>
        </div>

        {activeTab === 'overview' && (
          <div className="admin-section overview-section">
            <div className="overview-welcome">
              <h2>{t('admin.welcome')}</h2>
              <p>{t('admin.welcomeText')}</p>
            </div>
            {stats.pendingApps > 0 && (
              <div className="alert-banner">
                <span>{t('admin.alertBanner', { count: stats.pendingApps })}</span>
                <button onClick={() => setActiveTab('applications')}>{t('admin.viewRequests')}</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="admin-section">
            <div className="section-header"><h2>{t('admin.sellerApplications')}</h2></div>
            <div className="apps-grid">
              {applications.length === 0 ? (
                <div className="empty-state">{t('admin.noApplications')}</div>
              ) : (
                applications.map((app) => (
                  <div key={app._id} className={`app-card ${app.status}`}>
                    <div className="app-card-header">
                      <h3>{app.shopName}</h3>
                      <span className={`status-pill ${app.status}`}>{app.status}</span>
                    </div>
                    <p className="app-desc">{app.shopDescription}</p>
                    <div className="app-meta">
                      <div className="meta-item"><strong>{t('admin.applicant')}:</strong> {app.user?.name}</div>
                      <div className="meta-item"><strong>{t('admin.email')}:</strong> {app.user?.email}</div>
                      <div className="meta-item"><strong>{t('admin.contact')}:</strong> {app.phone}</div>
                      <div className="meta-item"><strong>{t('admin.location')}:</strong> {app.address}</div>
                    </div>
                    {app.status === 'pending' && (
                      <div className="app-actions-footer">
                        <button className="btn-approve" onClick={() => handleApprove(app._id)}>{t('admin.approveStore')}</button>
                        <button className="btn-reject" onClick={() => handleReject(app._id)}>{t('admin.reject')}</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-section">
            <div className="section-header"><h2>{t('admin.platformUserManagement')}</h2></div>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.userProfile')}</th>
                    <th>{t('admin.contactInfo')}</th>
                    <th>{t('admin.accountRole')}</th>
                    <th>{t('admin.memberSince')}</th>
                    <th>{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td><div className="user-profile-cell"><span className="user-name">{u.name}</span></div></td>
                      <td>{u.email}</td>
                      <td><span className={`role-pill ${u.role}`}>{t(`role.${u.role}`, {}, u.role)}</span></td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        {u.role === 'admin' ? (
                          <span className="text-muted">Protected</span>
                        ) : (
                          <button className="btn-delete" onClick={() => handleDeleteUser(u._id)}>{t('admin.remove')}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Sales Analytics</h2>
              <p className="section-sub">Revenue includes delivered items only</p>
            </div>

            {/* Summary cards */}
            <div className="sales-summary-grid">
              <div className="sales-summary-card sales-summary-card--primary">
                <div className="sales-summary-icon">৳</div>
                <div>
                  <div className="sales-summary-label">Total Revenue</div>
                  <div className="sales-summary-value">৳{(salesStats?.totalRevenue || 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="sales-summary-card">
                <div className="sales-summary-icon sales-summary-icon--blue">📦</div>
                <div>
                  <div className="sales-summary-label">Total Orders</div>
                  <div className="sales-summary-value">{salesStats?.totalOrders || 0}</div>
                </div>
              </div>
              <div className="sales-summary-card">
                <div className="sales-summary-icon sales-summary-icon--green">🏪</div>
                <div>
                  <div className="sales-summary-label">Active Sellers</div>
                  <div className="sales-summary-value">{salesStats?.sellers?.length || 0}</div>
                </div>
              </div>
            </div>

            {/* Seller leaderboard */}
            <div className="table-wrapper" style={{ marginTop: '24px' }}>
              <div className="sales-table-header">
                <span className="sales-table-title">Seller Leaderboard</span>
                <span className="sales-table-sub">Ranked by revenue</span>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Seller</th>
                    <th>Email</th>
                    <th>Orders</th>
                    <th>Items Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(salesStats?.sellers || []).length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No sales data yet</td></tr>
                  ) : (
                    (salesStats?.sellers || []).map((seller, idx) => {
                      return (
                        <tr key={seller.sellerId || idx} className={idx === 0 ? 'sales-row-top' : ''}>
                          <td>
                            <span className={`sales-rank sales-rank--${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : 'default'}`}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                            </span>
                          </td>
                          <td><span className="seller-name-cell">{seller.sellerName}</span></td>
                          <td className="text-muted">{seller.sellerEmail}</td>
                          <td><span className="sales-badge sales-badge--blue">{seller.totalOrders}</span></td>
                          <td><span className="sales-badge sales-badge--purple">{seller.totalItemsSold}</span></td>
                          <td><span className="sales-revenue">৳{seller.totalRevenue.toLocaleString()}</span></td>
                        </tr>
                      );
                    })
                  )}
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
