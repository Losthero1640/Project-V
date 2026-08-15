import { Server } from "socket.io";
import { ChatMessage } from "./models/chatMessage.models.js";
import { LiveStream } from "./models/livestream.models.js";
import { User } from "./models/user.models.js";

let io = null;
const streamViewers = new Map();

// Helper to determine Super Chat visual color tiers
const getSuperChatTier = (amount) => {
  if (amount >= 1000) return { tierColor: "red", pinnedDuration: 300 }; // 5 mins
  if (amount >= 500) return { tierColor: "orange", pinnedDuration: 180 }; // 3 mins
  if (amount >= 200) return { tierColor: "yellow", pinnedDuration: 120 }; // 2 mins
  if (amount >= 100) return { tierColor: "green", pinnedDuration: 60 }; // 1 min
  return { tierColor: "blue", pinnedDuration: 30 };
};

// AI Bot response generator
const generateBotReply = (command, text, stream) => {
  const lower = text.toLowerCase();

  if (command === "!help") {
    return "🤖 **VidTubeBot Commands:**\n• `!ask <question>` - Ask anything about the stream or tech\n• `!rules` - Community guidelines\n• `!socials` - Creator links\n• `!donate` - How to send Super Thanks";
  }

  if (command === "!rules") {
    return "📜 **Chat Rules:** Be respectful, no spamming, no offensive language, and enjoy the stream!";
  }

  if (command === "!socials") {
    return `🌐 Follow @${stream?.owner?.username || "creator"} on VidTube for updates and new videos!`;
  }

  if (command === "!donate") {
    return "💖 Click the **Super Chat** button below the chat box to send tips & highlight your message!";
  }

  if (command === "!ask") {
    const question = text.replace(/^!ask\s*/i, "").trim();
    if (!question) {
      return "🤖 Please provide a question: `!ask <your question here>`";
    }

    if (lower.includes("websocket") || lower.includes("socket")) {
      return `💡 **WebSockets:** Creates a continuous 2-way TCP channel between browser & server for real-time live chat without HTTP polling!`;
    }
    if (lower.includes("super chat") || lower.includes("tip") || lower.includes("payment")) {
      return `💖 **Super Chat:** Sends a direct tip via Razorpay with a glowing pinned banner on the stream ticker!`;
    }
    if (lower.includes("stack") || lower.includes("tech") || lower.includes("built")) {
      return `⚡ **VidTube Stack:** Built with React, Node.js, Express, MongoDB, Socket.io, and Razorpay Standard Web Checkout.`;
    }
    if (lower.includes("stream") || lower.includes("about") || lower.includes("title")) {
      return `🎥 **About this Stream:** "${stream?.title || "Live Stream"}" - ${stream?.description || "Live interactive broadcast on VidTube!"}`;
    }

    return `🤖 Great question about "${question}"! @${stream?.owner?.username || "creator"} will address this on stream shortly.`;
  }

  return null;
};

export const initializeSocket = (httpServer) => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:")
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    let currentStreamId = null;

    // Join a live stream room
    socket.on("join:stream", async ({ streamId, user }) => {
      currentStreamId = streamId;
      socket.join(streamId);

      const count = (streamViewers.get(streamId) || 0) + 1;
      streamViewers.set(streamId, count);

      io.to(streamId).emit("viewer:count", { streamId, count });
      await LiveStream.findByIdAndUpdate(streamId, { viewerCount: count });

      // Send bot welcome message once per join
      socket.emit("receive:message", {
        _id: `welcome_${Date.now()}`,
        username: "VidTubeBot",
        avatar: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png",
        message: "👋 Welcome to the live stream! Type `!help` for commands or support creator with Super Chat.",
        role: "BOT",
        isBot: true,
        createdAt: new Date(),
      });
    });

    // Handle incoming chat message
    socket.on("send:message", async ({ streamId, message, user }) => {
      if (!message || !message.trim()) return;

      const stream = await LiveStream.findById(streamId).populate("owner", "username");
      if (!stream) return;

      let role = "VIEWER";
      if (user?._id && stream.owner?._id && user._id.toString() === stream.owner._id.toString()) {
        role = "CREATOR";
      } else if (user?.isPremium) {
        role = "PREMIUM";
      }

      const chatDoc = await ChatMessage.create({
        stream: streamId,
        user: user?._id || null,
        username: user?.username || user?.fullName || "Anonymous Viewer",
        avatar: user?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        message: message.trim(),
        role,
      });

      const messagePayload = {
        _id: chatDoc._id,
        streamId,
        user: chatDoc.user,
        username: chatDoc.username,
        avatar: chatDoc.avatar,
        message: chatDoc.message,
        role: chatDoc.role,
        createdAt: chatDoc.createdAt,
      };

      io.to(streamId).emit("receive:message", messagePayload);

      // Check for bot commands
      const trimmed = message.trim();
      const firstWord = trimmed.split(" ")[0].toLowerCase();

      if (["!help", "!rules", "!socials", "!donate", "!ask"].includes(firstWord)) {
        const botReply = generateBotReply(firstWord, trimmed, stream);
        if (botReply) {
          setTimeout(() => {
            io.to(streamId).emit("receive:message", {
              _id: `bot_${Date.now()}`,
              streamId,
              username: "VidTubeBot",
              avatar: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png",
              message: botReply,
              role: "BOT",
              isBot: true,
              createdAt: new Date(),
            });
          }, 400);
        }
      }
    });

    // Handle floating reaction bursts
    socket.on("send:reaction", ({ streamId, emoji, user }) => {
      if (!streamId || !emoji) return;

      io.to(streamId).emit("receive:reaction", {
        id: `react_${Date.now()}_${Math.random()}`,
        emoji,
        username: user?.username || "Viewer",
      });
    });

    // Handle viewer disconnect or room leave
    const handleLeave = async () => {
      if (currentStreamId) {
        const count = Math.max(0, (streamViewers.get(currentStreamId) || 1) - 1);
        streamViewers.set(currentStreamId, count);

        io.to(currentStreamId).emit("viewer:count", { streamId: currentStreamId, count });
        await LiveStream.findByIdAndUpdate(currentStreamId, { viewerCount: count });
      }
    };

    socket.on("leave:stream", handleLeave);
    socket.on("disconnect", handleLeave);
  });

  return io;
};

// Export IO getter for controllers (e.g. broadcasting Super Chat)
export const getIO = () => io;

// Broadcast a verified Super Chat donation to stream room
export const broadcastSuperChat = async ({ streamId, user, amount, message }) => {
  if (!io || !streamId) return;

  const { tierColor, pinnedDuration } = getSuperChatTier(amount);

  const chatDoc = await ChatMessage.create({
    stream: streamId,
    user: user?._id || null,
    username: user?.username || user?.fullName || "Supporter",
    avatar: user?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    message: message || `💖 Sent ₹${amount} Super Chat!`,
    isSuperChat: true,
    amount,
    tierColor,
    pinnedDuration,
    role: user?.isPremium ? "PREMIUM" : "VIEWER",
  });

  const superChatPayload = {
    _id: chatDoc._id,
    streamId,
    user: chatDoc.user,
    username: chatDoc.username,
    avatar: chatDoc.avatar,
    message: chatDoc.message,
    amount: chatDoc.amount,
    tierColor: chatDoc.tierColor,
    pinnedDuration: chatDoc.pinnedDuration,
    isSuperChat: true,
    role: chatDoc.role,
    createdAt: chatDoc.createdAt,
    pinnedUntil: Date.now() + pinnedDuration * 1000,
  };

  io.to(streamId).emit("receive:message", superChatPayload);
  io.to(streamId).emit("superchat:received", superChatPayload);
};
