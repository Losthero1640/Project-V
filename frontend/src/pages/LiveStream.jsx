import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import "./LiveStream.css";

const SOCKET_SERVER_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, "")
  : "http://localhost:3000";

export const LiveStream = () => {
  const { streamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stream, setStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [viewerCount, setViewerCount] = useState(1);
  const [pinnedSuperChats, setPinnedSuperChats] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuperChatModal, setShowSuperChatModal] = useState(false);
  const [superChatAmount, setSuperChatAmount] = useState(100);
  const [superChatMessage, setSuperChatMessage] = useState("");
  const [donationLoading, setDonationLoading] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const socketRef = useRef(null);
  const chatBottomRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Fetch initial stream details and chat history
  useEffect(() => {
    const fetchStream = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/livestreams/${streamId}`);
        if (res.data?.data) {
          setStream(res.data.data.stream);
          setMessages(res.data.data.messages || []);
        }
      } catch (err) {
        console.error("Failed to load stream", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [streamId]);

  // Initialize WebSockets connection
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL, { withCredentials: true });

    socketRef.current.emit("join:stream", { streamId, user });

    socketRef.current.on("viewer:count", ({ count }) => {
      setViewerCount(count);
    });

    socketRef.current.on("receive:message", (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    socketRef.current.on("superchat:received", (superChat) => {
      setPinnedSuperChats((prev) => [...prev, superChat]);
    });

    socketRef.current.on("receive:reaction", (reaction) => {
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2500);
    });

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.emit("leave:stream");
        socketRef.current.disconnect();
      }
    };
  }, [streamId, user]);

  // Auto-scroll chat feed to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start Screen Sharing
  const handleStartScreenShare = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      mediaStreamRef.current = screenStream;
      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
        videoRef.current.play();
      }

      setIsScreenSharing(true);
      setIsCameraOn(false);

      screenStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        if (videoRef.current) videoRef.current.srcObject = null;
      };
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
    }
  };

  // Start Webcam Video
  const handleStartCamera = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      mediaStreamRef.current = cameraStream;
      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play();
      }

      setIsCameraOn(true);
      setIsScreenSharing(false);

      cameraStream.getVideoTracks()[0].onended = () => {
        setIsCameraOn(false);
        if (videoRef.current) videoRef.current.srcObject = null;
      };
    } catch (err) {
      console.warn("Camera access denied or failed:", err);
      alert("Please allow camera permissions in your browser.");
    }
  };

  // Stop Media Broadcast
  const handleStopBroadcast = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
    setIsCameraOn(false);
  };

  // Send standard chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current) return;

    socketRef.current.emit("send:message", {
      streamId,
      message: inputText.trim(),
      user,
    });

    setInputText("");
  };

  // Send floating emoji reaction burst
  const handleSendReaction = (emoji) => {
    if (!socketRef.current) return;
    socketRef.current.emit("send:reaction", { streamId, emoji, user });
  };

  // Trigger paid Super Chat via Razorpay
  const handleSuperChatPayment = async () => {
    try {
      setDonationLoading(true);

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        alert("Failed to load Razorpay Checkout SDK");
        setDonationLoading(false);
        return;
      }

      const orderRes = await api.post("/payments/create-order", {
        type: "SUPER_CHAT",
        amount: superChatAmount,
        streamId,
        recipientId: stream?.owner?._id,
        notes: {
          message: superChatMessage || `💖 Super Chat of ₹${superChatAmount}!`,
          streamId,
        },
      });

      const orderData = orderRes.data?.data;
      const orderId = orderData.order_id || orderData.orderId;
      const keyId = orderData.key_id || orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: "INR",
        name: "VidTube Super Chat",
        description: `Super Chat for @${stream?.owner?.username || "creator"}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setShowSuperChatModal(false);
            setSuperChatMessage("");
          } catch (err) {
            console.error("Super chat verification error", err);
          } finally {
            setDonationLoading(false);
          }
        },
        prefill: {
          name: user?.fullName || user?.username || "Supporter",
          email: user?.email || "",
        },
        theme: {
          color: "#ff7e5f",
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to initiate Super Chat");
      setDonationLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!window.confirm("Are you sure you want to end this live stream?")) return;
    try {
      handleStopBroadcast();
      await api.post(`/livestreams/${streamId}/end`);
      alert("Live stream ended.");
      navigate("/live");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#fff" }}>
        <p>Connecting to Live Stream...</p>
      </div>
    );
  }

  if (!stream) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#fff" }}>
        <h2>Live stream not found or ended.</h2>
      </div>
    );
  }

  const isStreamer = user?._id && stream?.owner?._id && user._id === stream.owner._id;

  return (
    <div className="livestream-container">
      {/* Left Column: Video Player & Stream Details */}
      <div className="livestream-main">
        <div className="livestream-player-wrapper">
          <span className="livestream-live-badge">🔴 LIVE</span>
          <span className="livestream-viewer-badge">👁️ {viewerCount} watching</span>

          <video
            ref={videoRef}
            className="livestream-video"
            src={!isScreenSharing && !isCameraOn ? stream.streamUrl : undefined}
            autoPlay
            controls
            playsInline
            muted={isStreamer}
          />

          {/* Streamer Screen/Cam controls prompt */}
          {isStreamer && !isScreenSharing && !isCameraOn && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                zIndex: 5,
              }}
            >
              <h3 style={{ color: "#fff", margin: 0 }}>🎥 Start Broadcasting Your Feed</h3>
              <p style={{ color: "#a1a1aa", margin: 0, fontSize: "0.9rem" }}>
                Share your screen, game, or webcam with your viewers
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={handleStartScreenShare}
                  style={{
                    background: "linear-gradient(135deg, #ff3b5c, #ff6c3b)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 18px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🖥️ Share Screen / Window
                </button>
                <button
                  onClick={handleStartCamera}
                  style={{
                    background: "#27272a",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    padding: "10px 18px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  📷 Turn On Camera
                </button>
              </div>
            </div>
          )}

          {/* Floating reaction particle overlay */}
          <div className="reactions-overlay">
            {reactions.map((r) => (
              <div key={r.id} className="floating-reaction">
                {r.emoji}
              </div>
            ))}
          </div>
        </div>

        <div className="livestream-info-card">
          <div className="livestream-title-row">
            <h1 className="livestream-title">{stream.title}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {isStreamer && (isScreenSharing || isCameraOn) && (
                <button
                  onClick={handleStopBroadcast}
                  style={{
                    background: "#3f3f46",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ⏸️ Switch Feed
                </button>
              )}
              {isStreamer && (
                <button className="end-stream-btn" onClick={handleEndStream}>
                  End Stream
                </button>
              )}
            </div>
          </div>

          <div className="livestream-meta-row">
            <div className="streamer-info">
              <img
                src={stream.owner?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt={stream.owner?.username}
                className="streamer-avatar"
              />
              <div>
                <div className="streamer-name">@{stream.owner?.username || "creator"}</div>
                <div style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>{stream.category}</div>
              </div>
            </div>

            {/* Quick Emoji Reaction Buttons */}
            <div className="stream-actions">
              <div className="reaction-bar">
                {["❤️", "🔥", "👏", "🚀", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    className="reaction-btn"
                    onClick={() => handleSendReaction(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {stream.description && (
            <p style={{ marginTop: 14, color: "#d4d4d8", fontSize: "0.95rem" }}>
              {stream.description}
            </p>
          )}
        </div>
      </div>

      {/* Right Column: YouTube-Style Live Chat Panel */}
      <div className="livestream-chat-panel">
        <div className="chat-header">
          <h3>💬 Live Chat</h3>
          <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>Top Chat</span>
        </div>

        {/* Pinned Super Chat Ticker */}
        {pinnedSuperChats.length > 0 && (
          <div className="superchat-ticker">
            {pinnedSuperChats.map((sc, idx) => (
              <div key={idx} className={`superchat-ticker-item ${sc.tierColor || "yellow"}`}>
                <span>👑 @{sc.username}</span>
                <span>₹{sc.amount}</span>
              </div>
            ))}
          </div>
        )}

        {/* Chat Feed */}
        <div className="chat-messages-container">
          {messages.map((msg, idx) => (
            <React.Fragment key={msg._id || idx}>
              {msg.isSuperChat ? (
                <div className={`superchat-card ${msg.tierColor || "yellow"}`}>
                  <div className="superchat-card-header">
                    <span>👑 {msg.username}</span>
                    <span>₹{msg.amount}</span>
                  </div>
                  <div className="superchat-card-body">{msg.message}</div>
                </div>
              ) : (
                <div className="chat-message-row">
                  <img
                    src={msg.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt={msg.username}
                    className="chat-user-avatar"
                  />
                  <div className="chat-content">
                    {msg.role === "CREATOR" && <span className="badge badge-creator">Creator</span>}
                    {msg.role === "PREMIUM" && <span className="badge badge-premium">Premium</span>}
                    {msg.role === "BOT" && <span className="badge badge-bot">BOT</span>}
                    <span className="chat-username">{msg.username}:</span>
                    <span style={{ color: msg.isBot ? "#60a5fa" : "#f4f4f5" }}>{msg.message}</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Chat Input & Super Chat Trigger */}
        <div className="chat-input-wrapper">
          <form className="chat-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder={user ? "Chat (try !help, !ask)..." : "Sign in to chat"}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!user}
            />
            <button type="submit" className="chat-send-btn" disabled={!user || !inputText.trim()}>
              ➤
            </button>
          </form>

          <button
            className="superchat-trigger-btn"
            onClick={() => setShowSuperChatModal(true)}
            disabled={!user}
          >
            💖 Send Super Chat
          </button>
        </div>
      </div>

      {/* Super Chat Modal */}
      {showSuperChatModal && (
        <div className="go-live-overlay" onClick={() => setShowSuperChatModal(false)}>
          <div className="go-live-card" onClick={(e) => e.stopPropagation()}>
            <div className="go-live-header">
              <h3>💖 Send Super Chat</h3>
              <button className="go-live-close" onClick={() => setShowSuperChatModal(false)}>
                &times;
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
              {[50, 100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 8,
                    border: "none",
                    background: superChatAmount === amt ? "#ffd700" : "#27272a",
                    color: superChatAmount === amt ? "#000" : "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onClick={() => setSuperChatAmount(amt)}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="go-live-input"
              placeholder="Your highlighted message (optional)"
              value={superChatMessage}
              onChange={(e) => setSuperChatMessage(e.target.value)}
              maxLength={150}
            />

            <button
              className="go-live-submit"
              onClick={handleSuperChatPayment}
              disabled={donationLoading}
              style={{ marginTop: 16 }}
            >
              {donationLoading ? "Processing..." : `Send ₹${superChatAmount} Super Chat`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
