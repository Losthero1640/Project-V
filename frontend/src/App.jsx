import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { UploadModal } from "./components/UploadModal";

// Pages
import { Home } from "./pages/Home";
import { VideoDetail } from "./pages/VideoDetail";
import { Channel } from "./pages/Channel";
import { Dashboard } from "./pages/Dashboard";
import { Playlists } from "./pages/Playlists";
import { PlaylistDetail } from "./pages/PlaylistDetail";
import { Tweets } from "./pages/Tweets";
import { WatchHistory } from "./pages/WatchHistory";
import { LikedVideos } from "./pages/LikedVideos";
import { Subscriptions } from "./pages/Subscriptions";
import { Auth } from "./pages/Auth";

function AppContent() {
  const [showUpload, setShowUpload] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleUploadSuccess = () => {
    alert("Video published successfully! Refreshing feed...");
    window.location.reload();
  };

  return (
    <div className="app-container">
      <Navbar
        onOpenUpload={() => setShowUpload(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="main-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>
        )}
        <main className="content-area">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/video/:videoId" element={<VideoDetail />} />
            <Route path="/channel/:username" element={<Channel />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlist/:playlistId" element={<PlaylistDetail />} />
            <Route path="/tweets" element={<Tweets />} />
            <Route path="/history" element={<WatchHistory />} />
            <Route path="/liked-videos" element={<LikedVideos />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
