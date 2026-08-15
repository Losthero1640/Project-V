import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import "./GoLiveModal.css";

export const GoLiveModal = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Gaming & Tech");
  const [thumbnail, setThumbnail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleStartStream = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a stream title");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/livestreams/create", {
        title: title.trim(),
        description: description.trim(),
        category,
        thumbnail: thumbnail.trim() || undefined,
      });

      if (res.data?.data) {
        onClose();
        navigate(`/live/${res.data.data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start live stream");
      setLoading(false);
    }
  };

  return (
    <div className="go-live-overlay" onClick={onClose}>
      <div className="go-live-card" onClick={(e) => e.stopPropagation()}>
        <div className="go-live-header">
          <h3>🔴 Go Live on VidTube</h3>
          <button className="go-live-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form className="go-live-form" onSubmit={handleStartStream}>
          {error && <p style={{ color: "#ff4d4d", fontSize: "0.85rem" }}>{error}</p>}

          <input
            type="text"
            className="go-live-input"
            placeholder="Live Stream Title (e.g. Building a Full-Stack Web App Live!)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="go-live-textarea"
            placeholder="Stream Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <select
            className="go-live-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Gaming & Tech">🎮 Gaming & Tech</option>
            <option value="Coding & Development">💻 Coding & Development</option>
            <option value="Music & Entertainment">🎵 Music & Entertainment</option>
            <option value="Podcasts & Chat">🎙️ Podcasts & Chat</option>
            <option value="Education & Science">📚 Education & Science</option>
          </select>

          <input
            type="url"
            className="go-live-input"
            placeholder="Custom Thumbnail URL (optional)"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
          />

          <button type="submit" className="go-live-submit" disabled={loading}>
            {loading ? "Starting Stream..." : "🔴 Launch Live Stream"}
          </button>
        </form>
      </div>
    </div>
  );
};
