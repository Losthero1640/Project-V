import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { formatRelativeTime } from "../components/VideoCard";
import "./Tweets.css";

export const Tweets = () => {
  const { user, isAuthenticated } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newTweet, setNewTweet] = useState("");
  const [tweeting, setTweeting] = useState(false);

  // Options menu & Editing states
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [editingTweetId, setEditingTweetId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const fetchUserTweets = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/tweets/user/${user._id}`);
      setTweets(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load community tweets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserTweets();
    } else {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

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

  const handlePostTweet = async (e) => {
    e.preventDefault();
    if (!newTweet.trim()) return;

    try {
      setTweeting(true);
      const res = await api.post("/tweets", { content: newTweet });
      // Insert new tweet at start
      setTweets((prev) => [res.data.data, ...prev]);
      setNewTweet("");
    } catch (err) {
      console.error(err);
      alert("Failed to post tweet.");
    } finally {
      setTweeting(false);
    }
  };

  const handleEditTweet = (tweetId, content) => {
    setEditingTweetId(tweetId);
    setEditingContent(content);
    setActiveDropdownId(null);
  };

  const handleUpdateTweetSubmit = async (tweetId) => {
    if (!editingContent.trim()) return;
    try {
      const res = await api.patch(`/tweets/${tweetId}`, { content: editingContent });
      setTweets((prev) =>
        prev.map((t) => (t._id === tweetId ? res.data.data : t))
      );
      setEditingTweetId(null);
      setEditingContent("");
    } catch (err) {
      console.error(err);
      alert("Failed to update tweet.");
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    if (!window.confirm("Are you sure you want to delete this community tweet?")) return;
    try {
      await api.delete(`/tweets/${tweetId}`);
      setTweets((prev) => prev.filter((t) => t._id !== tweetId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete tweet.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="empty-container">
        <h3>Sign In Required</h3>
        <p>Please sign in to read and post community tweets.</p>
        <Link to="/auth" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="tweets-page-container animate-fade-in">
      <div className="tweets-page-header">
        <h1>Community Tweets</h1>
        <p>Broadcast updates and notes directly to your subscribers.</p>
      </div>

      <form onSubmit={handlePostTweet} className="create-tweet-form glass animate-slide-up">
        <textarea
          placeholder="What's on your mind? Post a channel update..."
          value={newTweet}
          onChange={(e) => setNewTweet(e.target.value)}
          maxLength={280}
          required
        />
        <div className="tweet-form-footer">
          <span className="char-count">{280 - newTweet.length} characters remaining</span>
          <button type="submit" className="btn-primary" disabled={tweeting || !newTweet.trim()}>
            {tweeting ? "Posting..." : "Post Update"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading tweets feed...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
        </div>
      ) : tweets.length === 0 ? (
        <div className="empty-container">
          <h3>No tweets yet</h3>
          <p>Write your first tweet above to update your audience!</p>
        </div>
      ) : (
        <div className="tweets-list">
          {tweets.map((tweet) => {
            const isMyTweet = user && (tweet.owner?._id === user._id || tweet.owner === user._id);
            return (
              <div key={tweet._id} className="tweet-card glass animate-fade-in">
                <div className="tweet-header">
                  <img src={user.avatar} alt={user.username} className="tweet-avatar" />
                  <div className="tweet-header-info">
                    <h4>{user.fullName}</h4>
                    <span className="tweet-date">{formatRelativeTime(tweet.createdAt)}</span>
                  </div>
                  {isMyTweet && (
                    <div className="options-menu-container">
                      <button
                        className="options-menu-btn"
                        onClick={() => setActiveDropdownId(activeDropdownId === tweet._id ? null : tweet._id)}
                        title="Options"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                      {activeDropdownId === tweet._id && (
                        <div className="options-menu-dropdown">
                          <button
                            className="options-menu-item"
                            onClick={() => handleEditTweet(tweet._id, tweet.content)}
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
                              handleDeleteTweet(tweet._id);
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
                {editingTweetId === tweet._id ? (
                  <div className="edit-tweet-container">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      maxLength={280}
                      required
                    />
                    <div className="edit-tweet-actions">
                      <button className="btn-secondary" onClick={() => setEditingTweetId(null)}>Cancel</button>
                      <button className="btn-primary" onClick={() => handleUpdateTweetSubmit(tweet._id)}>Update</button>
                    </div>
                  </div>
                ) : (
                  <p className="tweet-text">{tweet.content}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
