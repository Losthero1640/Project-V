import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { VideoCard, formatViews, formatRelativeTime } from "../components/VideoCard";
import "./VideoDetail.css";

export const VideoDetail = () => {
  const { videoId } = useParams();
  const { user, isAuthenticated } = useAuth();
  
  const [video, setVideo] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState("");

  // Playlists modal states
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const playlistModalRef = useRef(null);

  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch Video Info
      const res = await api.get(`/videos/v/${videoId}`);
      const videoData = res.data.data;
      setVideo(videoData);
      setLikesCount(videoData.likesCount || 0);

      // Check if user likes this video (Fetch user liked videos and check if present)
      if (isAuthenticated) {
        try {
          const likedRes = await api.get("/likes/videos");
          const likedList = likedRes.data.data || [];
          setIsLiked(likedList.some((vid) => vid._id === videoId));
        } catch (e) {
          console.error("Failed to check liked status:", e);
        }

        // Check if user is subscribed to channel
        try {
          const subProfileRes = await api.get(`/users/c/${videoData.owner.username}`);
          const profile = subProfileRes.data.data;
          setIsSubscribed(profile.isSubscribed);
          setSubscribersCount(profile.subscribersCount);
        } catch (e) {
          console.error("Failed to check subscription status:", e);
        }
      } else {
        // Just fetch general subscriber count
        try {
          const channelRes = await api.get(`/users/c/${videoData.owner.username}`);
          setSubscribersCount(channelRes.data.data.subscribersCount || 0);
        } catch (e) {
          console.error(e);
        }
      }

      // 2. Fetch comments
      fetchComments();

      // 3. Fetch recommended videos (similar query or just list of videos)
      const listRes = await api.get("/videos", { params: { limit: 10 } });
      const list = listRes.data.data?.docs || [];
      // Filter out current video
      setRecommendations(list.filter((vid) => vid._id !== videoId));

    } catch (err) {
      console.error(err);
      setError("Failed to load video details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const commentsRes = await api.get(`/comments/${videoId}`);
      setComments(commentsRes.data.data?.docs || []);
    } catch (e) {
      console.error("Failed to fetch comments:", e);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoDetails();
  }, [videoId, isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".options-menu-container")) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle Like Toggle
  const handleLikeToggle = async () => {
    if (!isAuthenticated) return alert("Please sign in to like videos!");
    try {
      const res = await api.post(`/likes/toggle/v/${videoId}`);
      const liked = res.data.data.isLiked;
      setIsLiked(liked);
      setLikesCount((prev) => (liked ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Subscription Toggle
  const handleSubscribeToggle = async () => {
    if (!isAuthenticated) return alert("Please sign in to subscribe!");
    try {
      const res = await api.post(`/subscriptions/c/${video.owner._id}`);
      const subscribed = res.data.data.isSubscribed;
      setIsSubscribed(subscribed);
      setSubscribersCount((prev) => (subscribed ? prev + 1 : prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // Playlists Handling
  const handleOpenPlaylists = async () => {
    if (!isAuthenticated) return alert("Please sign in to save videos!");
    try {
      const res = await api.get(`/playlists/user/${user._id}`);
      setPlaylists(res.data.data || []);
      setShowPlaylistModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVideoInPlaylist = async (playlist) => {
    const isAlreadyInPlaylist = playlist.videos.some((v) => v._id === videoId);
    try {
      if (isAlreadyInPlaylist) {
        await api.patch(`/playlists/remove/${playlist._id}/${videoId}`);
      } else {
        await api.patch(`/playlists/add/${playlist._id}/${videoId}`);
      }
      // Re-fetch playlists to update checkboxes
      const res = await api.get(`/playlists/user/${user._id}`);
      setPlaylists(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Comments Operations
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return alert("Please sign in to comment!");
    if (!newComment.trim()) return;

    try {
      const res = await api.post(`/comments/${videoId}`, { content: newComment });
      setComments((prev) => [res.data.data, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditComment = async (commentId, currentText) => {
    setEditingCommentId(commentId);
    setEditingText(currentText);
  };

  const handleUpdateCommentSubmit = async (commentId) => {
    if (!editingText.trim()) return;
    try {
      const res = await api.patch(`/comments/c/${commentId}`, { content: editingText });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? res.data.data : c))
      );
      setEditingCommentId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await api.delete(`/comments/c/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading video player...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="error-container">
        <p>{error || "Video not found."}</p>
        <Link to="/" className="btn-secondary">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="video-detail-page animate-fade-in">
      <div className="video-main-content">
        {/* Video Player */}
        <div className="video-player-container">
          <video
            src={video.videoFile}
            controls
            autoPlay
            className="video-player"
            poster={video.thumbnail}
          ></video>
        </div>

        {/* Video Meta/Info */}
        <h1 className="video-page-title">{video.title}</h1>
        <div className="video-action-bar">
          <div className="video-owner-details">
            <Link to={`/channel/${video.owner.username}`}>
              <img
                src={video.owner.avatar || "https://res.cloudinary.com/losthero/image/upload/v1700000000/default-avatar.png"}
                alt={video.owner.username}
                className="channel-avatar-lg"
              />
            </Link>
            <div className="channel-text-info">
              <Link to={`/channel/${video.owner.username}`} className="channel-owner-name">
                {video.owner.fullName}
              </Link>
              <span className="channel-subs">{formatViews(subscribersCount).replace("views", "subscribers")}</span>
            </div>
            
            {user?._id !== video.owner._id && (
              <button
                className={`subscribe-button ${isSubscribed ? "subscribed" : ""}`}
                onClick={handleSubscribeToggle}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            )}
          </div>

          <div className="video-buttons">
            <button className={`video-action-btn ${isLiked ? "active" : ""}`} onClick={handleLikeToggle}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              <span>{likesCount} {likesCount === 1 ? "Like" : "Likes"}</span>
            </button>

            <button className="video-action-btn" onClick={handleOpenPlaylists}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 15 16 10 11 15" />
                <line x1="16" y1="10" x2="16" y2="22" />
                <path d="M4 4h16c1.1 0 2 .9 2 2v4M4 8h10M4 12h7" />
              </svg>
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Video Description Box */}
        <div className="video-description-box">
          <div className="box-meta">
            <span>{formatViews(video.views)}</span>
            <span>{formatRelativeTime(video.createdAt)}</span>
          </div>
          <p className="description-text">{video.description}</p>
        </div>

        {/* Comment Section */}
        <div className="comments-section">
          <h2>Comments ({comments.length})</h2>
          
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="add-comment-form">
              <img src={user?.avatar} alt="Me" className="commenter-avatar" />
              <div className="comment-input-container">
                <input
                  type="text"
                  placeholder="Add a public comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                {newComment.trim() && (
                  <div className="comment-input-actions animate-fade-in">
                    <button type="button" className="btn-secondary" onClick={() => setNewComment("")}>Cancel</button>
                    <button type="submit" className="btn-primary">Comment</button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <p className="signin-prompt">
              Please <Link to="/auth">Sign In</Link> to add comments.
            </p>
          )}

          {commentsLoading && comments.length === 0 ? (
            <div className="spinner"></div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => {
                const commentOwner = comment.owner || {};
                const isMyComment = user && commentOwner._id === user._id;

                return (
                  <div className="comment-item" key={comment._id}>
                    <img
                      src={commentOwner.avatar || "https://res.cloudinary.com/losthero/image/upload/v1700000000/default-avatar.png"}
                      alt={commentOwner.username}
                      className="commenter-avatar"
                    />
                    <div className="comment-content-area">
                      <div className="comment-item-header">
                        <span className="commenter-name">{commentOwner.fullName || "User"}</span>
                        <span className="commenter-handle">@{commentOwner.username || "username"}</span>
                        <span className="comment-date">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      
                      {editingCommentId === comment._id ? (
                        <div className="edit-comment-container">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                          />
                          <div className="edit-comment-actions">
                            <button className="btn-secondary" onClick={() => setEditingCommentId(null)}>Cancel</button>
                            <button className="btn-primary" onClick={() => handleUpdateCommentSubmit(comment._id)}>Update</button>
                          </div>
                        </div>
                      ) : (
                        <p className="comment-text">{comment.content}</p>
                      )}
                    </div>

                    {isMyComment && editingCommentId !== comment._id && (
                      <div className={`options-menu-container ${activeDropdownId === comment._id ? "active" : ""}`}>
                        <button
                          className="options-menu-btn"
                          onClick={() => setActiveDropdownId(activeDropdownId === comment._id ? null : comment._id)}
                          title="Options"
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>
                        {activeDropdownId === comment._id && (
                          <div className="options-menu-dropdown">
                            <button
                              className="options-menu-item"
                              onClick={() => {
                                handleEditComment(comment._id, comment.content);
                                setActiveDropdownId(null);
                              }}
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              className="options-menu-item delete"
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleDeleteComment(comment._id);
                              }}
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Column */}
      <div className="video-recommendations">
        <h2>Next Up</h2>
        <div className="recommendations-list">
          {recommendations.length === 0 ? (
            <p className="no-rec-text">No recommendations available</p>
          ) : (
            recommendations.map((vid) => (
              <div key={vid._id} className="rec-card">
                <Link to={`/video/${vid._id}`} className="rec-thumb">
                  <img src={vid.thumbnail} alt={vid.title} />
                </Link>
                <div className="rec-details">
                  <Link to={`/video/${vid._id}`} className="rec-title">{vid.title}</Link>
                  <Link to={`/channel/${vid.owner.username}`} className="rec-owner">{vid.owner.fullName}</Link>
                  <span className="rec-meta">{formatViews(vid.views)} • {formatRelativeTime(vid.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Playlist Selector Modal Overlay */}
      {showPlaylistModal && (
        <div className="modal-overlay glass" onClick={() => setShowPlaylistModal(false)}>
          <div className="modal-content playlist-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Save Video to...</h2>
              <button className="close-btn" onClick={() => setShowPlaylistModal(false)}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="playlists-select-list">
              {playlists.length === 0 ? (
                <p>No playlists found. You can create one from your Playlists tab.</p>
              ) : (
                playlists.map((playlist) => {
                  const isChecked = playlist.videos.some((v) => v._id === videoId);
                  return (
                    <label key={playlist._id} className="playlist-select-item">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleVideoInPlaylist(playlist)}
                      />
                      <span>{playlist.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
