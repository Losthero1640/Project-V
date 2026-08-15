import React from "react";
import "./EmptyState.css";

export const EmptyState = ({ title = "No items found", description, icon }) => {
  return (
    <div className="empty-container">
      {icon || (
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
};
