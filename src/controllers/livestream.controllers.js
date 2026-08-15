import mongoose from "mongoose";
import { LiveStream } from "../models/livestream.models.js";
import { ChatMessage } from "../models/chatMessage.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new live stream
export const createLiveStream = asyncHandler(async (req, res) => {
  const { title, description, category, thumbnail, streamUrl } = req.body;

  if (!title || !title.trim()) {
    throw new ApiError(400, "Stream title is required");
  }

  // End any previously active stream by this creator
  await LiveStream.updateMany(
    { owner: req.user._id, status: "LIVE" },
    { $set: { status: "ENDED", endedAt: new Date() } }
  );

  const stream = await LiveStream.create({
    title: title.trim(),
    description: description ? description.trim() : "",
    category: category || "Gaming & Tech",
    owner: req.user._id,
    thumbnail: thumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    streamUrl: streamUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    status: "LIVE",
    viewerCount: 1,
    startedAt: new Date(),
  });

  const populated = await LiveStream.findById(stream._id).populate(
    "owner",
    "username fullName avatar isPremium"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, populated, "Live stream created successfully"));
});

// Get all live streams
export const getAllLiveStreams = asyncHandler(async (req, res) => {
  const { status = "LIVE" } = req.query;

  const filter = status === "ALL" ? {} : { status };

  const streams = await LiveStream.find(filter)
    .populate("owner", "username fullName avatar isPremium")
    .sort({ status: 1, createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, streams, "Live streams fetched successfully"));
});

// Get single live stream by ID with chat message history
export const getLiveStreamById = asyncHandler(async (req, res) => {
  const { streamId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(streamId)) {
    throw new ApiError(400, "Invalid Stream ID");
  }

  const stream = await LiveStream.findById(streamId).populate(
    "owner",
    "username fullName avatar isPremium"
  );

  if (!stream) {
    throw new ApiError(404, "Live stream not found");
  }

  // Fetch recent 50 chat messages for this stream
  const messages = await ChatMessage.find({ stream: streamId })
    .sort({ createdAt: -1 })
    .limit(50);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        stream,
        messages: messages.reverse(),
      },
      "Live stream details retrieved successfully"
    )
  );
});

// End a live stream
export const endLiveStream = asyncHandler(async (req, res) => {
  const { streamId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(streamId)) {
    throw new ApiError(400, "Invalid Stream ID");
  }

  const stream = await LiveStream.findById(streamId);
  if (!stream) {
    throw new ApiError(404, "Live stream not found");
  }

  if (stream.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to end this stream");
  }

  stream.status = "ENDED";
  stream.endedAt = new Date();
  await stream.save();

  return res
    .status(200)
    .json(new ApiResponse(200, stream, "Live stream ended successfully"));
});
