import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../utils/api";
import { VideoCard } from "../components/VideoCard";
import "./Home.css";

export const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams(location.search);
      const query = params.get("query") || "";
      
      const res = await api.get("/videos", {
        params: {
          query,
          limit: 20,
        },
      });

      // res.data is ApiResponse, data is inside res.data.data
      if (res.data && res.data.data && res.data.data.docs) {
        setVideos(res.data.data.docs);
      } else {
        setVideos([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load videos. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [location.search]);

  return (
    <div className="home-page animate-fade-in">
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading videos...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button className="btn-secondary" onClick={fetchVideos}>
            Try Again
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-container">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
          </svg>
          <h3>No videos found</h3>
          <p>Try searching for something else or upload a new video!</p>
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
