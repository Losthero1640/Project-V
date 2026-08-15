import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema(
  {
    stream: {
      type: Schema.Types.ObjectId,
      ref: "LiveStream",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    username: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isSuperChat: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      default: 0,
    },
    tierColor: {
      type: String,
      default: "default",
    },
    pinnedDuration: {
      type: Number,
      default: 0,
    },
    isBot: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["CREATOR", "PREMIUM", "BOT", "MODERATOR", "VIEWER"],
      default: "VIEWER",
    },
  },
  {
    timestamps: true,
  }
);

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
