import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { VideoCard } from "../components/VideoCard";

export const LikedVideos = () => {
  const { isAuthenticated } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLikedVideos = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/likes/videos");
      setVideos(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch liked videos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLikedVideos();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="empty-container">
        <h3>Sign In Required</h3>
        <p>Please sign in to view your liked videos.</p>
        <Link to="/auth" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="liked-page animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1>Liked Videos</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Keep track of videos you've liked.</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading liked videos...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-container">
          <h3>No liked videos yet</h3>
          <p>Like some videos to populate this list!</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};
