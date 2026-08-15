import mongoose, { Schema } from "mongoose";

const liveStreamSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thumbnail: {
      type: String,
      default: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    },
    streamUrl: {
      type: String,
      default: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
    status: {
      type: String,
      enum: ["LIVE", "ENDED"],
      default: "LIVE",
    },
    category: {
      type: String,
      default: "Gaming & Tech",
    },
    viewerCount: {
      type: Number,
      default: 1,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const LiveStream = mongoose.model("LiveStream", liveStreamSchema);
