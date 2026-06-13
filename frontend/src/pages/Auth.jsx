import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Login State
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  // Register State
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        if (!emailOrUsername || !password) {
          throw new Error("Please fill in all fields.");
        }
        await login(emailOrUsername, password);
        navigate("/");
      } else {
        if (!fullName || !username || !email || !regPassword || !avatar) {
          throw new Error("Full name, username, email, password, and avatar are required.");
        }

        const formData = new FormData();
        formData.append("fullName", fullName);
        formData.append("username", username);
        formData.append("email", email);
        formData.append("password", regPassword);
        formData.append("avatar", avatar);
        if (coverImage) {
          formData.append("coverImage", coverImage);
        }

        await register(formData);
        // Automatically switch to login on success
        setIsLogin(true);
        setError("");
        alert("Registration successful! Please sign in.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card glass animate-slide-up">
        <div className="auth-header">
          <h2>{isLogin ? "Sign In to VidTube" : "Create your Account"}</h2>
          <p>{isLogin ? "Welcome back! Good to see you." : "Start sharing videos with the world."}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              {/* Image Previews Row */}
              <div className="previews-row">
                <div className="avatar-preview-container">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="circle-preview" />
                  ) : (
                    <div className="placeholder-preview circle">Avatar</div>
                  )}
                  <label className="image-select-label">
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                    Choose Avatar *
                  </label>
                </div>

                <div className="cover-preview-container">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover Banner" className="banner-preview" />
                  ) : (
                    <div className="placeholder-preview banner">Banner</div>
                  )}
                  <label className="image-select-label">
                    <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
                    Choose Banner (Optional)
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Choose a strong password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}

          {isLogin && (
            <>
              <div className="form-group">
                <label>Username or Email</label>
                <input
                  type="text"
                  placeholder="username or email"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              <div className="spinner"></div>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              disabled={loading}
              className="toggle-auth-mode-btn"
            >
              {isLogin ? "Create account" : "Sign in instead"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
