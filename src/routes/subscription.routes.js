import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/c/:channelId")
  .get(getUserChannelSubscribers)
  .post(verifyJWT, toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);

export { router };
