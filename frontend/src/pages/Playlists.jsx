import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import "./Playlists.css";

export const Playlists = () => {
  const { user, isAuthenticated } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Playlist state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchPlaylists = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/playlists/user/${user._id}`);
      setPlaylists(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch playlists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists();
    } else {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    try {
      setCreating(true);
      const res = await api.post("/playlists", { name, description });
      setPlaylists((prev) => [...prev, res.data.data]);
      setName("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create playlist.");
    } finally {
      setCreating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="empty-container">
        <h3>Sign In Required</h3>
        <p>Please sign in to view and create playlists.</p>
        <Link to="/auth" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="playlists-page animate-fade-in">
      <div className="playlists-header">
        <h1>My Playlists</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Create Playlist"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreatePlaylist} className="create-playlist-form glass animate-slide-up">
          <div className="form-group">
            <label>Playlist Name</label>
            <input
              type="text"
              placeholder="e.g. My Favorites"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="e.g. A collection of my favorite music videos"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading playlists...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
        </div>
      ) : playlists.length === 0 ? (
        <div className="empty-container">
          <h3>No playlists yet</h3>
          <p>Create a playlist and save videos to group them together!</p>
        </div>
      ) : (
        <div className="playlist-grid">
          {playlists.map((playlist) => (
            <Link key={playlist._id} to={`/playlist/${playlist._id}`} className="playlist-card glass">
              <div className="playlist-thumb-overlay">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                  <path d="M19 9H2v2h17V9zm0-4H2v2h17V5zM2 15h13v-2H2v2zm15-2v6l5-3-5-3z" />
                </svg>
                <span className="playlist-video-count">{playlist.videos?.length || 0} videos</span>
              </div>
              <h3 className="playlist-name">{playlist.name}</h3>
              <p className="playlist-desc">{playlist.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
