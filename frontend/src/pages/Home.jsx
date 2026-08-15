import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../utils/api";
import { VideoCard } from "../components/VideoCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
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
        <LoadingSpinner message="Loading videos..." />
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button className="btn-secondary" onClick={fetchVideos}>
            Try Again
          </button>
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          title="No videos found"
          description="Try searching for something else or upload a new video!"
        />
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
