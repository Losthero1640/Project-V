import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { VideoCard, formatViews } from "../components/VideoCard";
import "./Channel.jsx"; // self-referencing style import or css file
import "./Channel.css";

export const Channel = () => {
  const { username } = useParams();
  const { user: currentUser, updateAvatar, updateCoverImage, isAuthenticated } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [tweets, setTweets] = useState([]);
  
  const [activeTab, setActiveTab] = useState("videos");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Tweet state
  const [newTweet, setNewTweet] = useState("");
  const [tweeting, setTweeting] = useState(false);

  const isMyChannel = currentUser && currentUser.username === username;

  const fetchChannelProfile = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await api.get(`/users/c/${username}`);
      const profileData = res.data.data;
      setProfile(profileData);
      setIsSubscribed(profileData.isSubscribed);
      setSubscribersCount(profileData.subscribersCount || 0);

      // Fetch active tab items immediately
      fetchTabContent(activeTab, profileData._id);

    } catch (err) {
      console.error(err);
      setError("Channel not found.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTabContent = async (tab, ownerId) => {
    const id = ownerId || profile?._id;
    if (!id) return;

    try {
      if (tab === "videos") {
        const res = await api.get("/videos", { params: { userId: id } });
        setVideos(res.data.data?.docs || []);
      } else if (tab === "playlists") {
        const res = await api.get(`/playlists/user/${id}`);
        setPlaylists(res.data.data || []);
      } else if (tab === "tweets") {
        const res = await api.get(`/tweets/user/${id}`);
        setTweets(res.data.data || []);
      }
    } catch (e) {
      console.error(`Failed to fetch ${tab} for channel:`, e);
    }
  };

  useEffect(() => {
    fetchChannelProfile();
  }, [username, currentUser]);

  useEffect(() => {
    if (profile?._id) {
      fetchTabContent(activeTab);
    }
  }, [activeTab]);

  // Handle Subscribe
  const handleSubscribeToggle = async () => {
    if (!isAuthenticated) return alert("Please sign in to subscribe!");
    try {
      const res = await api.post(`/subscriptions/c/${profile._id}`);
      const subscribed = res.data.data.isSubscribed;
      setIsSubscribed(subscribed);
      setSubscribersCount((prev) => (subscribed ? prev + 1 : prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Photo Helpers
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const updatedUser = await updateAvatar(file);
      setProfile((prev) => ({ ...prev, avatar: updatedUser.avatar }));
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const updatedUser = await updateCoverImage(file);
      setProfile((prev) => ({ ...prev, coverImage: updatedUser.coverImage }));
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tweets management in Channel profile
  const handleCreateTweet = async (e) => {
    e.preventDefault();
    if (!newTweet.trim()) return;

    try {
      setTweeting(true);
      const res = await api.post("/tweets", { content: newTweet });
      setTweets((prev) => [res.data.data, ...prev]);
      setNewTweet("");
    } catch (err) {
      console.error(err);
    } finally {
      setTweeting(false);
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    if (!window.confirm("Delete this tweet?")) return;
    try {
      await api.delete(`/tweets/${tweetId}`);
      setTweets((prev) => prev.filter((t) => t._id !== tweetId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !profile) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading channel details...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="error-container">
        <p>{error || "Channel could not be loaded."}</p>
        <Link to="/" className="btn-secondary">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="channel-page animate-fade-in">
      {/* Banner/Cover Image */}
      <div className="channel-cover-container">
        <img
          src={profile.coverImage || "https://res.cloudinary.com/losthero/image/upload/v1700000000/default-cover.jpg"}
          alt="Channel Banner"
          className="channel-cover"
        />
        {isMyChannel && (
          <label className="cover-edit-btn glass">
            <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>Update Cover</span>
          </label>
        )}
      </div>

      {/* Profile Info Header */}
      <div className="channel-header">
        <div className="channel-meta-left">
          <div className="channel-avatar-container">
            <img src={profile.avatar} alt={profile.fullName} className="channel-page-avatar" />
            {isMyChannel && (
              <label className="avatar-edit-overlay">
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </label>
            )}
          </div>
          <div className="channel-title-stats">
            <h1>{profile.fullName}</h1>
            <p className="channel-username">@{profile.username}</p>
            <div className="channel-counts">
              <span>{formatViews(subscribersCount).replace("views", "Subscribers")}</span>
              <span className="dot">•</span>
              <span>{profile.channelsSubscribedToCount || 0} Subscribed</span>
            </div>
          </div>
        </div>

        <div className="channel-meta-right">
          {isMyChannel ? (
            <Link to="/dashboard" className="btn-secondary">
              Creator Studio
            </Link>
          ) : (
            <button
              className={`subscribe-button ${isSubscribed ? "subscribed" : ""}`}
              onClick={handleSubscribeToggle}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="channel-tabs glass">
        <button className={activeTab === "videos" ? "active" : ""} onClick={() => setActiveTab("videos")}>
          Videos
        </button>
        <button className={activeTab === "playlists" ? "active" : ""} onClick={() => setActiveTab("playlists")}>
          Playlists
        </button>
        <button className={activeTab === "tweets" ? "active" : ""} onClick={() => setActiveTab("tweets")}>
          Tweets
        </button>
        <button className={activeTab === "about" ? "active" : ""} onClick={() => setActiveTab("about")}>
          About
        </button>
      </div>

      {/* Tabs Content */}
      <div className="channel-tab-content">
        {activeTab === "videos" && (
          videos.length === 0 ? (
            <p className="no-items-text">No videos uploaded by this channel.</p>
          ) : (
            <div className="video-grid">
              {videos.map((video) => (
                <VideoCard key={video._id} video={{ ...video, owner: profile }} />
              ))}
            </div>
          )
        )}

        {activeTab === "playlists" && (
          playlists.length === 0 ? (
            <p className="no-items-text">No public playlists found.</p>
          ) : (
            <div className="playlist-grid">
              {playlists.map((playlist) => (
                <Link key={playlist._id} to={`/playlist/${playlist._id}`} className="playlist-card glass">
                  <div className="playlist-thumb-overlay">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                      <path d="M19 9H2v2h17V9zm0-4H2v2h17V5zM2 15h13v-2H2v2zm15-2v6l5-3-5-3z" />
                    </svg>
                    <span className="playlist-video-count">{playlist.videos?.length || 0} videos</span>
                  </div>
                  <h3 className="playlist-name">{playlist.name}</h3>
                  <p className="playlist-desc">{playlist.description}</p>
                </Link>
              ))}
            </div>
          )
        )}

        {activeTab === "tweets" && (
          <div className="tweets-tab">
            {isMyChannel && (
              <form onSubmit={handleCreateTweet} className="create-tweet-form glass">
                <textarea
                  placeholder="Share a community update..."
                  value={newTweet}
                  onChange={(e) => setNewTweet(e.target.value)}
                  maxLength={280}
                  required
                />
                <div className="tweet-form-footer">
                  <span className="char-count">{280 - newTweet.length} characters left</span>
                  <button type="submit" className="btn-primary" disabled={tweeting || !newTweet.trim()}>
                    {tweeting ? "Posting..." : "Post Tweet"}
                  </button>
                </div>
              </form>
            )}

            {tweets.length === 0 ? (
              <p className="no-items-text">No tweets posted yet.</p>
            ) : (
              <div className="tweets-list">
                {tweets.map((tweet) => (
                  <div key={tweet._id} className="tweet-card glass">
                    <div className="tweet-header">
                      <img src={profile.avatar} alt="" className="tweet-avatar" />
                      <div>
                        <h4>{profile.fullName}</h4>
                        <span>{formatRelativeTime(tweet.createdAt)}</span>
                      </div>
                      {isMyChannel && (
                        <button className="delete-tweet-btn" onClick={() => handleDeleteTweet(tweet._id)}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="tweet-text">{tweet.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="about-tab glass">
            <h2>About {profile.fullName}</h2>
            <div className="about-details">
              <p className="about-email"><strong>Email:</strong> {profile.email}</p>
              <p className="about-joined">
                <strong>Joined:</strong> {new Date(profile.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="about-desc">
                Welcome to my official VidTube channel! Check out my uploaded videos and playlists, or follow my community tweets tab to stay updated.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
