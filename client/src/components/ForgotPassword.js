import React, { useState, useEffect } from 'react';
import axios from '../api';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      if (res.data.success) {
        setStatus('success');
        setMessage('A 6-digit code has been sent to your email.');
        setStep(2);
        setCountdown(60);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to send code.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await axios.post('/api/auth/verify-reset-otp', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      if (res.data.success) {
        setStatus('idle');
        setMessage('');
        setStep(3);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Invalid or expired code.');
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setStatus('loading');
    try {
      const res = await axios.post('/api/auth/resend-otp', {
        email: email.trim().toLowerCase(),
        type: 'forgot-password',
      });
      if (res.data.success) {
        setStatus('success');
        setMessage('Code resent successfully!');
        setCountdown(60);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to resend code');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      const res = await axios.put(
        '/api/auth/reset-password',
        { email: email.trim().toLowerCase(), otp: otp.trim(), password },
        { withCredentials: true }
      );
      if (res.data.success) {
        setStatus('success');
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">
          {step === 1 ? t('auth.forgotTitle') : step === 2 ? t('auth.verifyCodeTitle') : t('auth.newPasswordTitle')}
        </h2>
        <p className="auth-subtitle">
          {step === 1
            ? t('auth.forgotSubtitle')
            : step === 2
            ? t('auth.sentCodeTo', { email })
            : t('auth.enterNewPassword')}
        </p>

        {status === 'success' && <div className="auth-success">{message}</div>}
        {status === 'error' && <div className="auth-error">{message}</div>}

        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendOtp}>
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
            <button type="submit" className="auth-submit-btn" disabled={status === 'loading'}>
              {status === 'loading' ? <div className="auth-spinner"></div> : t('auth.sendResetCode')}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="auth-form-group">
              <label>{t('auth.resetCode')}</label>
              <input
                type="text"
                placeholder={t('auth.enterSixDigit')}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength="6"
                className="auth-input otp-input"
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={status === 'loading'}>
              {status === 'loading' ? <div className="auth-spinner"></div> : t('auth.verifyCode')}
            </button>
            <div className="auth-resend-container" style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.9rem' }}>
              {countdown > 0 ? (
                <p style={{ color: '#6b7280' }}>{t('auth.resendIn', { count: countdown })}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{ background: 'none', border: 'none', color: '#fe424d', cursor: 'pointer', fontWeight: '600' }}
                >
                  {t('auth.resendVerification')}
                </button>
              )}
            </div>
            <button type="button" className="auth-back-btn" onClick={() => setStep(1)}>
              {t('auth.backToEmail')}
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="auth-form-group">
              <label>{t('auth.newPassword')}</label>
              <input
                type="password"
                placeholder={t('auth.enterNewPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                className="auth-input"
              />
            </div>
            <div className="auth-form-group">
              <label>{t('auth.confirmNewPassword')}</label>
              <input
                type="password"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
                className="auth-input"
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={status === 'loading'}>
              {status === 'loading' ? <div className="auth-spinner"></div> : t('auth.resetPassword')}
            </button>
          </form>
        )}

        <div className="auth-switch">
          <Link to="/login">{t('auth.backToLogin')}</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
