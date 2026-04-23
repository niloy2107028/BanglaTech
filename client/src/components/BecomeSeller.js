import React, { useState, useEffect } from 'react';
import axios from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './BecomeSeller.css';

const BecomeSeller = () => {
  const [formData, setFormData] = useState({
    shopName: '',
    shopDescription: '',
    address: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [application, setApplication] = useState(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await axios.get('/api/sellers/my-application', { withCredentials: true });
        if (res.data.success && res.data.data) {
          setApplication(res.data.data);
          setStatus(res.data.data.status);
        }
      } catch (err) {
        console.error('Error fetching application:', err);
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
      const res = await axios.post('/api/sellers/apply', formData, { withCredentials: true });
      if (res.data.success) {
        setApplication(res.data.data);
        setStatus('pending');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'seller') {
    return (
      <div className="become-seller-page">
        <div className="status-card approved">
          <h2>{t('seller.congrats')}</h2>
          <p>{t('seller.alreadySeller')}</p>
          <button className="btn-primary" onClick={() => navigate('/profile')}>{t('seller.goDashboard')}</button>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="become-seller-page">
        <div className="status-card pending">
          <h2>{t('seller.underReview')}</h2>
          <p>{t('seller.reviewDescription', { shopName: application?.shopName || '' })}</p>
          <p>{t('seller.reviewNotice')}</p>
          <button className="btn-secondary" onClick={() => navigate('/')}>{t('seller.backHome')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="become-seller-page">
      <div className="become-seller-container">
        <div className="become-seller-header">
          <h1>{t('seller.journeyTitle')}</h1>
          <p>{t('seller.journeyDescription')}</p>
        </div>

        <form onSubmit={handleSubmit} className="become-seller-form">
          <div className="form-group">
            <label>{t('seller.shopName')}</label>
            <input
              type="text"
              name="shopName"
              placeholder={t('seller.shopNamePlaceholder')}
              required
              value={formData.shopName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>{t('seller.shopDescription')}</label>
            <textarea
              name="shopDescription"
              placeholder={t('seller.shopDescriptionPlaceholder')}
              required
              value={formData.shopDescription}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>{t('seller.businessAddress')}</label>
            <input
              type="text"
              name="address"
              placeholder={t('seller.businessAddressPlaceholder')}
              required
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>{t('seller.contactPhone')}</label>
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
            {loading ? t('seller.submitting') : t('seller.submitApplication')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BecomeSeller;
