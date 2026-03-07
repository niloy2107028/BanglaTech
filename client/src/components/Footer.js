import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faHeart } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Company Info */}
          <div className="footer-section">
            <h3>BanglaMart</h3>
            <p>
              Your trusted online shopping destination for everything you need.
            </p>
            <p className="footer-tagline">
              Wide Selection • Best Prices • Fast Delivery
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li>
                <a href="#about">About Us</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
              <li>
                <a href="#delivery">Delivery Info</a>
              </li>
              <li>
                <a href="#returns">Returns Policy</a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="footer-section">
            <h4>Categories</h4>
            <ul className="footer-links">
              <li>
                <a href="#electronics">Electronics</a>
              </li>
              <li>
                <a href="#fashion">Fashion</a>
              </li>
              <li>
                <a href="#home">Home & Living</a>
              </li>
              <li>
                <a href="#beauty">Beauty & Health</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-section">
            <h4>Get In Touch</h4>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <FontAwesomeIcon icon={faEnvelope} /> info@banglamart.com
              </li>
              <li className="footer-contact-item">📞 +880 1234-567890</li>
              <li className="footer-contact-item">📍 Dhaka, Bangladesh</li>
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
            © {new Date().getFullYear()} BanglaMart. All rights reserved. Made
            with <FontAwesomeIcon icon={faHeart} className="footer-heart" />{" "}
            using MERN Stack
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
