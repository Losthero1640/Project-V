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
          {tweets.map((tweet) => (
            <div key={tweet._id} className="tweet-card glass animate-fade-in">
              <div className="tweet-header">
                <img src={user.avatar} alt={user.username} className="tweet-avatar" />
                <div className="tweet-header-info">
                  <h4>{user.fullName}</h4>
                  <span className="tweet-date">{formatRelativeTime(tweet.createdAt)}</span>
                </div>
                <button className="delete-tweet-btn" onClick={() => handleDeleteTweet(tweet._id)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
              <p className="tweet-text">{tweet.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
