import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

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
    setStatus("loading");
    try {
      const res = await axios.post("/api/auth/forgot-password", { email });
      if (res.data.success) {
        setStatus("success");
        setMessage("A 6-digit code has been sent to your email.");
        setStep(2);
        setCountdown(60); // Start 1-minute countdown
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Failed to send code.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await axios.post("/api/auth/verify-reset-otp", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      if (res.data.success) {
        setStatus("idle");
        setMessage("");
        setStep(3);
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Invalid or expired code.");
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setStatus("loading");
    try {
      const res = await axios.post("/api/auth/resend-otp", {
        email: email.trim().toLowerCase(),
        type: "forgot-password",
      });
      if (res.data.success) {
        setStatus("success");
        setMessage("Code resent successfully!");
        setCountdown(60); // Reset countdown
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Failed to resend code");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");
    try {
      const res = await axios.put(
        "/api/auth/reset-password",
        { email: email.trim().toLowerCase(), otp: otp.trim(), password },
        { withCredentials: true },
      );
      if (res.data.success) {
        setStatus("success");
        setMessage("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">
          {step === 1 ? "Forgot Password" : step === 2 ? "Verify Code" : "New Password"}
        </h2>
        <p className="auth-subtitle">
          {step === 1 
            ? "Enter your email address to receive a verification code." 
            : step === 2 
            ? `We've sent a 6-digit code to ${email}`
            : "Enter your new password below."}
        </p>
        
        {status === "success" && <div className="auth-success">{message}</div>}
        {status === "error" && <div className="auth-error">{message}</div>}
        
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendOtp}>
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
            <button type="submit" className="auth-submit-btn" disabled={status === "loading"}>
              {status === "loading" ? <div className="auth-spinner"></div> : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="auth-form-group">
              <label>6-Digit Reset Code</label>
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
            <button type="submit" className="auth-submit-btn" disabled={status === "loading"}>
              {status === "loading" ? <div className="auth-spinner"></div> : "Verify Code"}
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
              onClick={() => setStep(1)}
            >
              Back to Email
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="auth-form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                className="auth-input"
              />
            </div>
            <div className="auth-form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
                className="auth-input"
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={status === "loading"}>
              {status === "loading" ? <div className="auth-spinner"></div> : "Reset Password"}
            </button>
          </form>
        )}

        <div className="auth-switch">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
