import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import "./Auth.css";

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      await api.post(`/users/reset-password/${token}`, { password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired or is invalid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card glass animate-slide-up">
        <div className="auth-header">
          <h2>Create New Password</h2>
          <p>Please enter and confirm your new password below.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div 
              className="auth-success" 
              style={{ 
                color: "#4caf50", 
                background: "rgba(76, 175, 80, 0.1)", 
                padding: "16px", 
                borderRadius: "6px", 
                marginBottom: "24px", 
                fontSize: "14px",
                border: "1px solid rgba(76, 175, 80, 0.2)",
                textAlign: "center"
              }}
            >
              Password reset successful! You can now sign in with your new password.
            </div>
            <button 
              className="btn-primary auth-submit-btn" 
              onClick={() => navigate("/auth")}
              style={{ width: "100%" }}
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : "Reset Password"}
            </button>
          </form>
        )}

        {!success && (
          <div className="auth-footer">
            <button 
              className="toggle-auth-mode-btn"
              onClick={() => navigate("/auth")}
              disabled={loading}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
