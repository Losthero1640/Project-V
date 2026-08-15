import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { GoLiveModal } from "../components/GoLiveModal";
import "./LiveStreams.css";

export const LiveStreams = () => {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);

  const fetchLiveStreams = async () => {
    try {
      setLoading(true);
      const res = await api.get("/livestreams?status=LIVE");
      setStreams(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch live streams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStreams();
  }, []);

  return (
    <div className="livestreams-page">
      <div className="livestreams-header">
        <h1>🔴 Live on VidTube</h1>
        {user && (
          <button className="go-live-banner-btn" onClick={() => setShowGoLiveModal(true)}>
            🔴 Go Live
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#a1a1aa" }}>
          Loading live streams...
        </div>
      ) : streams.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#a1a1aa" }}>
          <h3>No one is live right now!</h3>
          <p>Be the first to start a live stream and chat with viewers in real time.</p>
          {user ? (
            <button
              className="go-live-banner-btn"
              style={{ margin: "20px auto 0 auto" }}
              onClick={() => setShowGoLiveModal(true)}
            >
              Start Live Stream
            </button>
          ) : (
            <Link to="/auth" className="go-live-banner-btn" style={{ margin: "20px auto 0 auto", display: "inline-flex" }}>
              Sign In to Go Live
            </Link>
          )}
        </div>
      ) : (
        <div className="livestreams-grid">
          {streams.map((s) => (
            <Link key={s._id} to={`/live/${s._id}`} className="stream-card">
              <div className="stream-card-thumbnail-wrapper">
                <img src={s.thumbnail} alt={s.title} className="stream-card-thumbnail" />
                <span className="stream-card-badge">🔴 LIVE</span>
                <span className="stream-card-viewers">👁️ {s.viewerCount || 1} watching</span>
              </div>
              <div className="stream-card-body">
                <img
                  src={s.owner?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt={s.owner?.username}
                  className="stream-card-avatar"
                />
                <div className="stream-card-info">
                  <div className="stream-card-title">{s.title}</div>
                  <div className="stream-card-creator">@{s.owner?.username || "creator"}</div>
                  <div className="stream-card-category">{s.category}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showGoLiveModal && <GoLiveModal onClose={() => setShowGoLiveModal(false)} />}
    </div>
  );
};
