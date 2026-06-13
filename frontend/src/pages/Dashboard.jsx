import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { formatViews } from "../components/VideoCard";
import "./Dashboard.css";

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Modal/State
  const [editingVideo, setEditingVideo] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch channel stats
      const statsRes = await api.get("/dashboard/stats");
      setStats(statsRes.data.data);

      // 2. Fetch channel videos
      const videosRes = await api.get("/dashboard/videos");
      setVideos(videosRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load studio dashboard. Make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Toggle Publish Status
  const handleTogglePublish = async (videoId) => {
    try {
      const res = await api.patch(`/videos/toggle/publish/${videoId}`);
      setVideos((prev) =>
        prev.map((v) =>
          v._id === videoId ? { ...v, isPublished: res.data.data.isPublished } : v
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to toggle publish status.");
    }
  };

  // Delete Video
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to permanently delete this video? This action cannot be undone.")) return;
    try {
      await api.delete(`/videos/v/${videoId}`);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      
      // Update stats totals dynamically
      setStats((prev) => ({
        ...prev,
        totalVideos: Math.max(0, prev.totalVideos - 1),
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to delete video.");
    }
  };

  // Edit triggers
  const startEdit = (video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description);
    setEditFile(null);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim()) return;

    const formData = new FormData();
    formData.append("title", editTitle);
    formData.append("description", editDescription);
    if (editFile) {
      formData.append("thumbnail", editFile);
    }

    try {
      setUpdating(true);
      const res = await api.patch(`/videos/v/${editingVideo._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update state
      setVideos((prev) =>
        prev.map((v) => (v._id === editingVideo._id ? res.data.data : v))
      );
      setEditingVideo(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update video details.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Creator Studio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <Link to="/" className="btn-secondary">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-header-title">
        <h1>Channel Dashboard</h1>
        <p className="welcome-text">Manage your channel content and check performance insights.</p>
      </div>

      {/* Stats Cards Row */}
      {stats && (
        <div className="stats-row">
          <div className="stats-card glass">
            <div className="stats-icon-container views-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="stats-data">
              <h3>{formatViews(stats.totalViews).replace("views", "")}</h3>
              <p>Total Views</p>
            </div>
          </div>

          <div className="stats-card glass">
            <div className="stats-icon-container subscribers-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="stats-data">
              <h3>{stats.subscribersCount}</h3>
              <p>Subscribers</p>
            </div>
          </div>

          <div className="stats-card glass">
            <div className="stats-icon-container likes-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            </div>
            <div className="stats-data">
              <h3>{stats.totalLikes}</h3>
              <p>Total Likes</p>
            </div>
          </div>

          <div className="stats-card glass">
            <div className="stats-icon-container videos-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div className="stats-data">
              <h3>{stats.totalVideos}</h3>
              <p>Videos Uploaded</p>
            </div>
          </div>
        </div>
      )}

      {/* Videos List Table */}
      <div className="dashboard-content-table glass">
        <h2>Uploaded Videos</h2>
        {videos.length === 0 ? (
          <div className="table-empty">
            <p>You haven't uploaded any videos yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Video</th>
                  <th>Visibility</th>
                  <th>Views</th>
                  <th>Date Uploaded</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video._id}>
                    <td className="table-video-info">
                      <img src={video.thumbnail} alt="" className="table-thumb" />
                      <div className="table-video-title">
                        <Link to={`/video/${video._id}`}>{video.title}</Link>
                      </div>
                    </td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={video.isPublished}
                          onChange={() => handleTogglePublish(video._id)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">{video.isPublished ? "Public" : "Private"}</span>
                      </label>
                    </td>
                    <td>{video.views || 0}</td>
                    <td>{new Date(video.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions">
                        <button className="edit-action" onClick={() => startEdit(video)} title="Edit Details">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                          </svg>
                        </button>
                        <button className="delete-action" onClick={() => handleDeleteVideo(video._id)} title="Delete Video">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Video Overlay Modal */}
      {editingVideo && (
        <div className="modal-overlay glass">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2>Edit Video Details</h2>
              <button className="close-btn" onClick={() => setEditingVideo(null)}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="modal-form">
              <div className="form-group">
                <label>New Thumbnail (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFile(e.target.files[0])}
                  disabled={updating}
                  className="file-input"
                />
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={updating}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={updating}
                  rows={5}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditingVideo(null)} disabled={updating}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={updating}>
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
