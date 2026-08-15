import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  getRazorpayKey,
} from "../controllers/payment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public route to get publishable Razorpay key ID
router.route("/key").get(getRazorpayKey);

// Protected payment routes
router.route("/create-order").post(verifyJWT, createPaymentOrder);
router.route("/orders").post(verifyJWT, createPaymentOrder);
router.route("/verify").post(verifyJWT, verifyPayment);
router.route("/verify-payment").post(verifyJWT, verifyPayment);
router.route("/history").get(verifyJWT, getPaymentHistory);

export { router };
