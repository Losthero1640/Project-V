# VidTube - Full-Stack Video & Community Platform

VidTube is a premium full-stack video-sharing application built using the MERN stack (MongoDB, Express.js, React.js, Node.js). It supports video uploads, subscriber tracking, playlists, and user comments, combined with advanced system optimizations.

---

## 🌟 What Makes VidTube Unique (Beyond YouTube)?

While VidTube delivers classic video-sharing capabilities, it introduces custom features and engineering practices that set it apart:

### 1. Unified Video and Community Feed (Tweets)
Unlike YouTube, which segregates community posts from standard video flows, VidTube features a **dedicated Tweets Feed**. Creators can broadcast short, text-based updates and announcements directly in the sidebar community channel, combining video hosting with a microblogging environment.

### 2. Fault-Tolerant, Connection-Resilient Redis Caching
High-traffic pages (video streaming views, search listings, and creator statistics) are cached in Redis. 
*   **The Uniqueness**: If Redis is offline or crashes, **the backend does not fail**. It intercepts the socket connection drops, prints a single warning to the log, and transparently falls back to MongoDB.

### 3. Automatic JWT Renewal Interceptor
VidTube handles session security via a dual-token (Access + Refresh JWT) system stored in secure `HttpOnly` cookies. If your access token expires mid-session, the frontend's Axios interceptor automatically sends a silent request to the `/refresh-token` endpoint, rotates the keys, and retries your initial request without interrupting the user.

---

## 🛠️ Tech Stack
*   **Frontend**: React.js (JavaScript), Vanilla CSS, React Router, Axios.
*   **Backend**: Node.js, Express.js, MongoDB (Mongoose), Redis (Caching).
*   **Asset Storage**: Cloudinary API (handling media, avatars, and banner uploads).
*   **Logging**: Winston (persistent file logging) + Morgan (HTTP request logger).

---

## 🚀 Getting Started

### 1. Clone & Setup Environment
Create a `.env` file in the root folder of the project with the following keys:
```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=your_mongodb_connection_uri
ACCESS_TOKEN_SECRET=your_jwt_access_secret
ACCESS_TOKEN_EXPIRY=600h
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

---

### 2. Run the Backend
1. From the project root, install packages and start the dev server:
   ```bash
   npm install
   ```
2. Start the Express server:
   ```bash
   npm run dev
   ```
*The server will start on `http://localhost:3000`.*

---

### 3. Run the Frontend
1. Open a new terminal window, navigate to the frontend folder, and install packages:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start the React/Vite development server:
   ```bash
   npm run dev
   ```
*Open **`http://localhost:5173`** in your browser to view the application.*
