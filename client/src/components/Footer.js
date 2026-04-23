import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faHeart } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-section">
            <h3>BanglaMart</h3>
            <p>{t('footer.companyText')}</p>
            <p className="footer-tagline">{t('footer.tagline')}</p>
          </div>

          <div className="footer-section">
            <h4>{t('footer.quickLinks')}</h4>
            <ul className="footer-links">
              <li><a href="#about">{t('footer.aboutUs')}</a></li>
              <li><a href="#contact">{t('footer.contact')}</a></li>
              <li><a href="#delivery">{t('footer.deliveryInfo')}</a></li>
              <li><a href="#returns">{t('footer.returnsPolicy')}</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>{t('footer.categories')}</h4>
            <ul className="footer-links">
              <li><a href="#electronics">{t('footer.electronics')}</a></li>
              <li><a href="#fashion">{t('footer.fashion')}</a></li>
              <li><a href="#home">{t('footer.homeLiving')}</a></li>
              <li><a href="#beauty">{t('footer.beautyHealth')}</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>{t('footer.getInTouch')}</h4>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <FontAwesomeIcon icon={faEnvelope} /> info@banglamart.com
              </li>
              <li className="footer-contact-item">📞 +880 1234-567890</li>
              <li className="footer-contact-item">📍 {t('footer.location')}</li>
            </ul>
            <div className="footer-social">
              <a href="#facebook" className="footer-social-icon">
                <FontAwesomeIcon icon={faGithub} />
              </a>
              <a href="#linkedin" className="footer-social-icon">
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
              <a href="#email" className="footer-social-icon">
                <FontAwesomeIcon icon={faEnvelope} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} BanglaMart. {t('footer.rights')}{' '}
            <FontAwesomeIcon icon={faHeart} className="footer-heart" /> {t('footer.usingMern')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
