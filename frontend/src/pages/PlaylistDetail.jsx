import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { formatDuration, formatViews, formatRelativeTime } from "../components/VideoCard";
import "./PlaylistDetail.css";

export const PlaylistDetail = () => {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOwner = playlist && user && playlist.owner === user._id;

  const fetchPlaylistDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/playlists/${playlistId}`);
      setPlaylist(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Playlist not found or failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylistDetails();
  }, [playlistId]);

  const handleRemoveVideo = async (videoId) => {
    if (!window.confirm("Remove this video from the playlist?")) return;
    try {
      await api.patch(`/playlists/remove/${playlistId}/${videoId}`);
      // Update local state
      setPlaylist((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v._id !== videoId),
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to remove video.");
    }
  };

  const handleDeletePlaylist = async () => {
    if (!window.confirm("Are you sure you want to delete this playlist? This action cannot be undone.")) return;
    try {
      await api.delete(`/playlists/${playlistId}`);
      navigate("/playlists");
    } catch (err) {
      console.error(err);
      alert("Failed to delete playlist.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading playlist details...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="error-container">
        <p>{error || "Playlist not found."}</p>
        <Link to="/playlists" className="btn-secondary">Back to Playlists</Link>
      </div>
    );
  }

  return (
    <div className="playlist-detail-page animate-fade-in">
      {/* Sidebar Info Card */}
      <div className="playlist-info-sidebar glass">
        <div className="playlist-sidebar-thumb">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path d="M19 9H2v2h17V9zm0-4H2v2h17V5zM2 15h13v-2H2v2zm15-2v6l5-3-5-3z" />
          </svg>
        </div>
        <h1 className="playlist-name-title">{playlist.name}</h1>
        <p className="playlist-video-count-info">{playlist.videos?.length || 0} videos</p>
        <p className="playlist-description-info">{playlist.description}</p>
        
        {isOwner && (
          <button className="btn-secondary delete-playlist-btn" onClick={handleDeletePlaylist}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete Playlist
          </button>
        )}
      </div>

      {/* Videos List */}
      <div className="playlist-videos-list">
        {playlist.videos?.length === 0 ? (
          <div className="empty-playlist">
            <p>No videos in this playlist yet. Add videos from the video page!</p>
          </div>
        ) : (
          playlist.videos.map((vid, index) => {
            const videoOwner = vid.owner || {};
            return (
              <div key={vid._id} className="playlist-video-item glass animate-fade-in">
                <span className="video-index">{index + 1}</span>
                <Link to={`/video/${vid._id}`} className="playlist-vid-thumb">
                  <img src={vid.thumbnail} alt={vid.title} />
                  <span className="playlist-vid-duration">{formatDuration(vid.duration)}</span>
                </Link>
                <div className="playlist-vid-details">
                  <Link to={`/video/${vid._id}`} className="playlist-vid-title">
                    {vid.title}
                  </Link>
                  <Link to={`/channel/${videoOwner.username}`} className="playlist-vid-owner">
                    {videoOwner.fullName || "Creator"}
                  </Link>
                  <span className="playlist-vid-meta">
                    {formatViews(vid.views)} • {formatRelativeTime(vid.createdAt)}
                  </span>
                </div>
                {isOwner && (
                  <button className="remove-vid-btn" onClick={() => handleRemoveVideo(vid._id)} title="Remove from playlist">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
