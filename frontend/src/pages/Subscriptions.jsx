import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import "./Subscriptions.css";

export const Subscriptions = () => {
  const { user, isAuthenticated } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSubscriptions = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/subscriptions/u/${user._id}`);
      setChannels(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptions();
    } else {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="empty-container">
        <h3>Sign In Required</h3>
        <p>Please sign in to view your subscriptions.</p>
        <Link to="/auth" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="subscriptions-page animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1>Subscriptions</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Channels you have subscribed to.</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading subscriptions...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
        </div>
      ) : channels.length === 0 ? (
        <div className="empty-container">
          <h3>No subscriptions yet</h3>
          <p>Explore videos and subscribe to channels to see them here!</p>
        </div>
      ) : (
        <div className="channels-grid">
          {channels.map((sub) => {
            const channel = sub.channel || {};
            return (
              <Link key={sub._id} to={`/channel/${channel.username}`} className="channel-card glass">
                <img
                  src={channel.avatar || "https://res.cloudinary.com/losthero/image/upload/v1700000000/default-avatar.png"}
                  alt={channel.fullName}
                  className="channel-card-avatar"
                />
                <h3>{channel.fullName}</h3>
                <p>@{channel.username}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
