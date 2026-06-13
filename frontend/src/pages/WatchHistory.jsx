import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { VideoCard } from "../components/VideoCard";

export const WatchHistory = () => {
  const { isAuthenticated } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWatchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/users/history");
      setVideos(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch watch history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchHistory();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="empty-container">
        <h3>Sign In Required</h3>
        <p>Please sign in to view your watch history.</p>
        <Link to="/auth" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="history-page animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1>Watch History</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Track videos you have recently watched.</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-container">
          <h3>History is empty</h3>
          <p>Watch some videos to build up your watch history feed!</p>
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
