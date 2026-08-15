import { Router } from "express";
import {
  createLiveStream,
  getAllLiveStreams,
  getLiveStreamById,
  endLiveStream,
} from "../controllers/livestream.controllers.js";
import { verifyJWT, verifyJWTOptional } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(getAllLiveStreams);
router.route("/create").post(verifyJWT, createLiveStream);
router.route("/:streamId").get(verifyJWTOptional, getLiveStreamById);
router.route("/:streamId/end").post(verifyJWT, endLiveStream);

export { router };
