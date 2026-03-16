import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./RegisterPage.css";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await register(name, email, password);
      setSuccess(data.message);
      setShowOtpInput(true);
      setCountdown(60); // Start 1-minute countdown
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/auth/verify-email",
        { email: email.trim().toLowerCase(), otp: otp.trim() },
        { withCredentials: true },
      );
      if (res.data.success) {
        setSuccess("Email verified successfully! Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError("");
    setSuccess("");
    try {
      const res = await axios.post("/api/auth/resend-otp", {
        email: email.trim().toLowerCase(),
        type: "register",
      });
      if (res.data.success) {
        setSuccess("Code resent successfully!");
        setCountdown(60); // Reset countdown
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    }
  };

  return (
    <section className="auth-page auth-page-register">
      <div className="auth-card">
        <h2 className="auth-title">
          {showOtpInput ? "Verify Email" : "Create Account"}
        </h2>
        <p className="auth-subtitle">
          {showOtpInput
            ? `We've sent a 6-digit code to ${email}`
            : "Join BanglaMart and start shopping today."}
        </p>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        {!showOtpInput ? (
          <>
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="auth-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
              <div className="auth-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
              <div className="auth-form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
              >
                {loading ? (
                  <div className="auth-spinner"></div>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button
              className="google-btn"
              onClick={() =>
                (window.location.href = "http://localhost:5000/api/auth/google")
              }
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
              />
              <span>Continue with Google</span>
            </button>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="auth-form-group">
              <label>6-Digit Verification Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength="6"
                className="auth-input otp-input"
              />
            </div>
            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? <div className="auth-spinner"></div> : "Verify Code"}
            </button>
            <div className="auth-resend-container" style={{ marginTop: "15px", textAlign: "center", fontSize: "0.9rem" }}>
              {countdown > 0 ? (
                <p style={{ color: "#6b7280" }}>Resend code in {countdown}s</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{ background: "none", border: "none", color: "#fe424d", cursor: "pointer", fontWeight: "600" }}
                >
                  Resend Verification Code
                </button>
              )}
            </div>
            <button
              type="button"
              className="auth-back-btn"
              onClick={() => setShowOtpInput(false)}
            >
              Back to Registration
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default RegisterPage;
