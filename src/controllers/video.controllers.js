import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { getCache, setCache, delCache, delCachePrefix } from "../utils/redis.js";

const recentViews = new Map();

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

  // Generate cache key
  const cacheKey = `videos:list:${page}:${limit}:${query || "none"}:${sortBy}:${sortType}:${userId || "all"}`;
  
  // Try to get from Redis cache
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, "Videos fetched from cache"));
  }

  const matchStage = {};
  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } }
    ];
  }

  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid User ID");
    }
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  } else {
    // If not requested by a specific channel, only show published ones
    matchStage.isPublished = true;
  }

  const sortStage = {};
  sortStage[sortBy] = sortType === "asc" ? 1 : -1;

  const videoAggregate = Video.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            }
          }
        ]
      }
    },
    {
      $addFields: {
        owner: { $first: "$ownerDetails" }
      }
    },
    {
      $project: {
        ownerDetails: 0
      }
    },
    { $sort: sortStage }
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const videosResult = await Video.aggregatePaginate(videoAggregate, options);

  // Cache list for 60 seconds (short-lived to handle additions)
  await setCache(cacheKey, videosResult, 60);

  return res
    .status(200)
    .json(new ApiResponse(200, videosResult, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || title.trim() === "" || !description || description.trim() === "") {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(500, "Failed to upload video to Cloudinary");
  }

  if (!thumbnail) {
    // Clean up uploaded video if thumbnail upload fails
    if (videoFile.public_id) {
      await deleteFromCloudinary(videoFile.public_id);
    }
    throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
  }

  console.log("videoFile structure:", videoFile);
  console.log("thumbnail structure:", thumbnail);

  try {
    const video = await Video.create({
      videoFile: videoFile.url,
      thumbnail: thumbnail.url,
      title,
      description,
      duration: videoFile.duration || 0,
      owner: req.user._id,
      isPublished: true
    });
  
    // Clear list caches
    await delCachePrefix("videos:list");
    await delCachePrefix("dashboard:stats");
  
    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video published successfully"));
  } catch (error) {
    console.error("DB write error details:", error);
    // Cleanup Cloudinary resources if DB write fails
    if (videoFile?.public_id) {
      await deleteFromCloudinary(videoFile.public_id);
    }
    if (thumbnail?.public_id) {
      await deleteFromCloudinary(thumbnail.public_id);
    }
    throw new ApiError(500, "Error writing video to database", error);
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const cacheKey = `video:${videoId}`;
  let video = await getCache(cacheKey);

  if (!video) {
    video = await Video.findById(videoId).populate("owner", "username fullName avatar");
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    // Set to cache (expires in 5 minutes)
    await setCache(cacheKey, video, 300);
  }

  // Convert to object to dynamically assign view/likes fields
  const videoObject = typeof video.toObject === "function" ? video.toObject() : video;

  // 1. IP + VideoId Throttling for views to avoid double/triple increments on concurrent requests (React StrictMode etc.)
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const viewKey = `${ip}-${videoId}`;
  const now = Date.now();
  const lastViewTime = recentViews.get(viewKey);

  let shouldIncrement = true;
  if (lastViewTime && (now - lastViewTime < 10000)) { // 10 seconds throttle window
    shouldIncrement = false;
  }

  if (shouldIncrement) {
    recentViews.set(viewKey, now);

    // Housekeeping: clean up keys older than 1 minute to prevent memory leak
    for (const [key, val] of recentViews.entries()) {
      if (now - val > 60000) {
        recentViews.delete(key);
      }
    }

    // Increment views in MongoDB
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    
    // Update local response field
    videoObject.views = (videoObject.views || 0) + 1;

    // Refresh cache with the new view count
    const updatedVideo = await Video.findById(videoId).populate("owner", "username fullName avatar");
    if (updatedVideo) {
      await setCache(cacheKey, updatedVideo, 300);
    }
  }

  // 2. Fetch total likes count for this video
  const likesCount = await Like.countDocuments({ video: videoId });
  videoObject.likesCount = likesCount;

  return res
    .status(200)
    .json(new ApiResponse(200, videoObject, "Video retrieved successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  if ((title && title.trim() === "") || (description && description.trim() === "")) {
    throw new ApiError(400, "Title and description cannot be empty");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to update this video");
  }

  const updateFields = {};
  if (title) updateFields.title = title;
  if (description) updateFields.description = description;

  const thumbnailLocalPath = req.file?.path;
  let oldThumbnailUrl = video.thumbnail;
  let newThumbnail = null;

  if (thumbnailLocalPath) {
    newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!newThumbnail) {
      throw new ApiError(500, "Failed to upload new thumbnail");
    }
    updateFields.thumbnail = newThumbnail.url;
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateFields },
    { new: true }
  ).populate("owner", "username fullName avatar");

  // If update succeeded and a new thumbnail was uploaded, delete the old one from Cloudinary
  if (newThumbnail && oldThumbnailUrl) {
    try {
      const publicId = oldThumbnailUrl.split("/").pop().split(".")[0];
      await deleteFromCloudinary(publicId);
    } catch (e) {
      // Log error but do not disrupt client success response
      console.error("Failed to delete old thumbnail from Cloudinary:", e);
    }
  }

  // Invalidate Redis cache
  await delCache(`video:${videoId}`);
  await delCachePrefix("videos:list");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to delete this video");
  }

  // Delete from Cloudinary
  try {
    const videoFilePublicId = video.videoFile.split("/").pop().split(".")[0];
    const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];
    
    await deleteFromCloudinary(videoFilePublicId);
    await deleteFromCloudinary(thumbnailPublicId);
  } catch (error) {
    console.error("Failed to delete media from Cloudinary during video deletion:", error);
  }

  await Video.findByIdAndDelete(videoId);

  // Invalidate cache
  await delCache(`video:${videoId}`);
  await delCachePrefix("videos:list");
  await delCachePrefix("dashboard:stats");

  return res
    .status(200)
    .json(new ApiResponse(200, { videoId }, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to modify this video");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  // Invalidate Cache
  await delCache(`video:${videoId}`);
  await delCachePrefix("videos:list");
  await delCachePrefix("dashboard:stats");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videoId, isPublished: video.isPublished },
        "Video publish status toggled successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
