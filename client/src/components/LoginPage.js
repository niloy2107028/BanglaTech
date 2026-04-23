import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './LoginPage.css';
import { googleAuthUrl } from '../api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page auth-page-login">
      <div className="auth-card">
        <h2 className="auth-title">{t('auth.welcomeBack')}</h2>
        <p className="auth-subtitle">{t('auth.loginSubtitle')}</p>

        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label>{t('auth.emailAddress')}</label>
            <input
              type="email"
              placeholder={t('auth.enterEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          <div className="auth-form-group">
            <label>{t('auth.password')}</label>
            <input
              type="password"
              placeholder={t('auth.enterPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          <div className="auth-forgot-password">
            <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
          </div>
          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? <div className="auth-spinner"></div> : t('navbar.login')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('auth.or')}</span>
        </div>

        <button className="google-btn" onClick={() => (window.location.href = googleAuthUrl)}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          />
          <span>{t('auth.continueWithGoogle')}</span>
        </button>

        <p className="auth-switch">
          {t('auth.noAccount')} <Link to="/register">{t('navbar.register')}</Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
