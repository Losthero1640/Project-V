import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export const Navbar = ({ onOpenUpload }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Sync search input with URL query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("query") || "";
    setSearch(q);
  }, [location.search]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?query=${encodeURIComponent(search.trim())}`);
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/auth");
  };

  return (
    <nav className="navbar glass">
      <div className="nav-left">
        <Link to="/" className="logo-container">
          <svg className="logo-icon" viewBox="0 0 24 24" width="32" height="32">
            <path fill="url(#logo-grad)" d="M23,12A11,11 0 0,0 12,1A11,11 0 0,0 1,12A11,11 0 0,0 12,23A11,11 0 0,0 23,12M8,17V7L16,12L8,17Z" />
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff3b5c" />
                <stop offset="100%" stopColor="#ff6c3b" />
              </linearGradient>
            </defs>
          </svg>
          <span className="logo-text">VidTube</span>
        </Link>
      </div>

      <div className="nav-middle">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>
      </div>

      <div className="nav-right">
        {isAuthenticated ? (
          <div className="user-controls">
            <button className="upload-btn" onClick={onOpenUpload} title="Upload Video">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Create</span>
            </button>

            <div className="profile-dropdown-container" ref={dropdownRef}>
              <img
                src={user?.avatar || "https://res.cloudinary.com/losthero/image/upload/v1700000000/default-avatar.png"}
                alt="Profile"
                className="nav-avatar"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              />
              {dropdownOpen && (
                <div className="profile-dropdown glass animate-fade-in">
                  <div className="dropdown-user-info">
                    <p className="user-name">{user?.fullName}</p>
                    <p className="user-handle">@{user?.username}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <Link to={`/channel/${user?.username}`} className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Channel
                  </Link>
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="9" />
                      <rect x="14" y="3" width="7" height="5" />
                      <rect x="14" y="12" width="7" height="9" />
                      <rect x="3" y="16" width="7" height="5" />
                    </svg>
                    Creator Studio
                  </Link>
                  <Link to="/playlists" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    Playlists
                  </Link>
                  <Link to="/liked-videos" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    Liked Videos
                  </Link>
                  <Link to="/history" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Watch History
                  </Link>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="15" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link to="/auth" className="btn-primary signin-link">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};
