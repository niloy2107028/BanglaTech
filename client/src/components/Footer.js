import React from "react";
import { FaGithub, FaLinkedin, FaEnvelope, FaHeart } from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <h3>BanglaMart</h3>
            <p>
              Your trusted online shopping destination for everything you need.
            </p>
            <p className="tagline">
              Wide Selection • Best Prices • Fast Delivery
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
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
            <ul>
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
            <ul className="contact-list">
              <li>
                <FaEnvelope /> info@banglamart.com
              </li>
              <li>📞 +880 1234-567890</li>
              <li>📍 Dhaka, Bangladesh</li>
            </ul>
            <div className="social-links">
              <a href="#facebook">
                <FaGithub />
              </a>
              <a href="#linkedin">
                <FaLinkedin />
              </a>
              <a href="#email">
                <FaEnvelope />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} BanglaMart. All rights reserved. Made
            with <FaHeart className="heart-icon" /> using MERN Stack
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
