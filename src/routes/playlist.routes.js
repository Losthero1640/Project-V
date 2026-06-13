import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Secure editing routes
router.route("/").post(verifyJWT, createPlaylist);

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(verifyJWT, updatePlaylist)
  .delete(verifyJWT, deletePlaylist);

router.route("/add/:playlistId/:videoId").patch(verifyJWT, addVideoToPlaylist);
router.route("/remove/:playlistId/:videoId").patch(verifyJWT, removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export { router };
