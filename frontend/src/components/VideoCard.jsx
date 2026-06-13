import React from "react";
import { Link } from "react-router-dom";
import "./VideoCard.css";

export const formatDuration = (secs) => {
  if (isNaN(secs) || secs === null || secs === undefined) return "00:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const formatViews = (views) => {
  const v = views || 0;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M views`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K views`;
  return `${v} views`;
};

export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
};

export const VideoCard = ({ video }) => {
  const owner = video.owner || {};

  return (
    <div className="video-card animate-fade-in">
      <Link to={`/video/${video._id}`} className="thumbnail-container">
        <img
          src={video.thumbnail || "https://res.cloudinary.com/losthero/image/upload/v1700000000/default-thumbnail.jpg"}
          alt={video.title}
          className="video-thumbnail"
          loading="lazy"
        />
        <span className="video-duration">{formatDuration(video.duration)}</span>
      </Link>

      <div className="video-details">
        <Link to={`/channel/${owner.username}`} className="channel-avatar-link">
          <img
            src={owner.avatar || "https://res.cloudinary.com/losthero/image/upload/v1700000000/default-avatar.png"}
            alt={owner.username}
            className="channel-avatar"
            loading="lazy"
          />
        </Link>
        <div className="video-info">
          <Link to={`/video/${video._id}`}>
            <h3 className="video-title" title={video.title}>
              {video.title}
            </h3>
          </Link>
          <Link to={`/channel/${owner.username}`} className="video-owner-name">
            {owner.fullName || "Creator"}
          </Link>
          <div className="video-meta">
            <span>{formatViews(video.views)}</span>
            <span className="meta-dot">•</span>
            <span>{formatRelativeTime(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
