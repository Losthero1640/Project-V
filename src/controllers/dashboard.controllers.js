import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getCache, setCache } from "../utils/redis.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cacheKey = `dashboard:stats:${userId}`;
  const cachedStats = await getCache(cacheKey);
  if (cachedStats) {
    return res.status(200).json(new ApiResponse(200, cachedStats, "Channel stats fetched from cache"));
  }

  // 1. Get total video views & count of videos
  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        totalVideos: { $sum: 1 },
      },
    },
  ]);

  const totalViews = videoStats[0]?.totalViews || 0;
  const totalVideos = videoStats[0]?.totalVideos || 0;

  // 2. Get total subscribers count
  const subscribersCount = await Subscription.countDocuments({
    channel: userId,
  });

  // 3. Get total likes count across all user's videos
  const likesStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "videoLikes",
      },
    },
    {
      $project: {
        likesCount: { $size: "$videoLikes" },
      },
    },
    {
      $group: {
        _id: null,
        totalLikesCount: { $sum: "$likesCount" },
      },
    },
  ]);

  const totalLikes = likesStats[0]?.totalLikesCount || 0;

  const stats = {
    totalViews,
    totalVideos,
    subscribersCount,
    totalLikes,
  };

  // Cache dashboard stats for 5 minutes
  await setCache(cacheKey, stats, 300);

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
