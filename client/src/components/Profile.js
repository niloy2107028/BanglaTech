import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightFromBracket,
  faCalendarDays,
  faEnvelope,
  faIdBadge,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Profile.css';

const ProfilePage = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const { t, formatDate } = useLanguage();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) return <p className="profile-loading">{t('profile.loadingProfile')}</p>;
  if (!user) return null;

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const joinedDate = user.createdAt ? formatDate(user.createdAt) : t('profile.activeAccount', {}, 'Active account');
  const roleLabel = t(`role.${user.role}`, {}, user.role.toUpperCase());

  return (
    <section className="profile-page">
      <div className="profile-container">
        <div className="profile-card" aria-labelledby="profile-title">
          <div className="profile-header">
            <div className="profile-avatar" aria-hidden="true">
              {initials}
            </div>

            <div className="profile-heading">
              <p className="profile-kicker">{t('profile.accountOverview', {}, 'Account overview')}</p>
              <h2 id="profile-title" className="profile-title">
                {user.name}
              </h2>
              <p className="profile-subtitle">{user.email}</p>
            </div>

            <span className={`profile-role-badge ${user.role.toUpperCase()}`}>{roleLabel}</span>
          </div>

          <div className="profile-info-section">
            <div className="profile-row">
              <span className="profile-row-icon">
                <FontAwesomeIcon icon={faUser} />
              </span>
              <div>
                <p className="profile-label">{t('profile.fullName')}</p>
                <p className="profile-value">{user.name}</p>
              </div>
            </div>

            <div className="profile-row">
              <span className="profile-row-icon">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <div>
                <p className="profile-label">{t('profile.emailAddress')}</p>
                <p className="profile-value">{user.email}</p>
              </div>
            </div>

            <div className="profile-row">
              <span className="profile-row-icon">
                <FontAwesomeIcon icon={faIdBadge} />
              </span>
              <div>
                <p className="profile-label">{t('profile.accountRole')}</p>
                <p className="profile-value">{roleLabel}</p>
              </div>
            </div>

            <div className="profile-row">
              <span className="profile-row-icon">
                <FontAwesomeIcon icon={faCalendarDays} />
              </span>
              <div>
                <p className="profile-label">{t('profile.memberStatus', {}, 'Member Status')}</p>
                <p className="profile-value">{joinedDate}</p>
              </div>
            </div>
          </div>

          <div className="profile-actions-section">
            <div className="profile-logout-section">
              <button onClick={handleLogout} className="profile-logout-btn">
                <FontAwesomeIcon icon={faArrowRightFromBracket} />
                {t('profile.signOut')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ProfilePage;
