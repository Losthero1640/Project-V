import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

export const Sidebar = ({ isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar glass ${isOpen ? "open" : ""}`}>
      <div className="sidebar-group">
        <NavLink to="/" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} end>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </NavLink>

        <NavLink to="/subscriptions" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span>Subscriptions</span>
        </NavLink>
      </div>

      <hr className="sidebar-divider" />

      <div className="sidebar-group">
        <NavLink to="/playlists" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>Playlists</span>
        </NavLink>

        <NavLink to="/liked-videos" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          <span>Liked Videos</span>
        </NavLink>

        <NavLink to="/history" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>History</span>
        </NavLink>
      </div>

      <hr className="sidebar-divider" />

      <div className="sidebar-group">
        <NavLink to="/tweets" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>Tweets</span>
        </NavLink>

        {isAuthenticated && (
          <NavLink to="/dashboard" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            <span>Dashboard</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
};
