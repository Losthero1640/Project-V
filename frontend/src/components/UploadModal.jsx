import React, { useState } from "react";
import { api } from "../utils/api";
import "./UploadModal.css";

export const UploadModal = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!videoFile) {
      setError("Please select a video file.");
      return;
    }
    if (!thumbnail) {
      setError("Please select a thumbnail image.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("videoFile", videoFile);
    formData.append("thumbnail", thumbnail);

    try {
      setUploading(true);
      setProgress(0);

      await api.post("/videos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      setUploading(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setUploading(false);
      setError(err.response?.data?.message || "Failed to upload video. Please try again.");
    }
  };

  return (
    <div className="modal-overlay glass">
      <div className="modal-content animate-slide-up">
        <div className="modal-header">
          <h2>Upload Video</h2>
          <button className="close-btn" onClick={onClose} disabled={uploading}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Video File *</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              disabled={uploading}
              className="file-input"
              required
            />
            {videoFile && <p className="selected-file-name">Selected: {videoFile.name}</p>}
          </div>

          <div className="form-group">
            <label>Thumbnail Image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
              disabled={uploading}
              className="file-input"
              required
            />
            {thumbnail && <p className="selected-file-name">Selected: {thumbnail.name}</p>}
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="Give your video a catchy title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              placeholder="Tell viewers what your video is about"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              rows={4}
              required
            />
          </div>

          {uploading ? (
            <div className="upload-progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">{progress === 100 ? "Processing on server..." : `Uploading: ${progress}%`}</p>
            </div>
          ) : (
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Publish
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
