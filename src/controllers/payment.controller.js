import crypto from "crypto";
import Razorpay from "razorpay";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Payment } from "../models/payment.models.js";
import { User } from "../models/user.models.js";
import { broadcastSuperChat } from "../socket.js";

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new ApiError(500, "Razorpay credentials missing in environment variables");
  }

  return new Razorpay({ key_id, key_secret });
};

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { type = "ORDER", amount, currency = "INR", receipt, recipientId, videoId, streamId, notes = {} } = req.body;

  let amountInPaise = 0;

  if (type === "PREMIUM_SUBSCRIPTION") {
    amountInPaise = 199 * 100;
  } else if (type === "SUPER_THANKS" || type === "SUPER_CHAT") {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount < 1) {
      throw new ApiError(400, "Donation amount must be at least ₹1");
    }
    amountInPaise = Math.round(parsedAmount * 100);
  } else {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      throw new ApiError(400, "Valid payment amount is required");
    }
    amountInPaise = parsedAmount < 100 ? Math.round(parsedAmount * 100) : Math.round(parsedAmount);
  }

  if (amountInPaise < 100) {
    throw new ApiError(400, "Minimum payment amount is 100 paise (₹1)");
  }

  const orderReceipt = receipt || `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  let order;
  try {
    const razorpay = getRazorpayInstance();
    order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: orderReceipt,
      notes: {
        userId: req.user?._id ? req.user._id.toString() : "",
        type,
        videoId: videoId || "",
        streamId: streamId || "",
        recipientId: recipientId || "",
        ...notes,
      },
    });
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to create Razorpay order");
  }

  const payment = await Payment.create({
    user: req.user._id,
    recipient: recipientId || null,
    video: videoId || null,
    type,
    amount: amountInPaise,
    currency: order.currency || currency || "INR",
    status: "PENDING",
    orderId: order.id,
    notes: {
      type,
      videoId: videoId || "",
      streamId: streamId || "",
      receipt: order.receipt || orderReceipt,
      message: notes.message || "",
    },
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        order_id: order.id,
        orderId: order.id,
        amount: order.amount,
        amountInRupees: order.amount / 100,
        currency: order.currency || "INR",
        key_id: process.env.RAZORPAY_KEY_ID,
        keyId: process.env.RAZORPAY_KEY_ID,
        receipt: order.receipt,
        paymentId: payment._id,
      },
      "Payment order created successfully"
    )
  );
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const razorpay_order_id = req.body.razorpay_order_id || req.body.order_id || req.body.orderId;
  const razorpay_payment_id = req.body.razorpay_payment_id || req.body.payment_id || req.body.paymentId;
  const razorpay_signature = req.body.razorpay_signature || req.body.signature;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing payment verification parameters");
  }

  const payment = await Payment.findOne({ orderId: razorpay_order_id });
  if (!payment) {
    throw new ApiError(404, "Payment record not found");
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) {
    throw new ApiError(500, "Razorpay secret key not configured on server");
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", key_secret)
    .update(body)
    .digest("hex");

  const isSignatureValid =
    expectedSignature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(razorpay_signature, "utf-8")
    );

  if (!isSignatureValid) {
    payment.status = "FAILED";
    await payment.save();
    throw new ApiError(400, "Payment verification failed: Invalid Signature");
  }

  payment.status = "SUCCESS";
  payment.paymentId = razorpay_payment_id;
  payment.signature = razorpay_signature;
  await payment.save();

  // If payment is Super Chat on a live stream, broadcast in real-time
  const streamId = payment.notes?.get("streamId");
  const donationMessage = payment.notes?.get("message");
  if (payment.type === "SUPER_CHAT" || streamId) {
    const donorUser = await User.findById(payment.user).select("username fullName avatar isPremium");
    await broadcastSuperChat({
      streamId,
      user: donorUser,
      amount: payment.amount / 100,
      message: donationMessage,
    });
  }

  let updatedUser = null;
  if (payment.type === "PREMIUM_SUBSCRIPTION") {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          isPremium: true,
          premiumExpiry: thirtyDaysFromNow,
        },
      },
      { new: true }
    ).select("-password -refreshToken");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        payment,
        user: updatedUser || req.user,
        verified: true,
      },
      "Payment verified successfully"
    )
  );
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const payments = await Payment.find({
    $or: [{ user: userId }, { recipient: userId }],
  })
    .populate("user", "username fullName avatar")
    .populate("recipient", "username fullName avatar")
    .populate("video", "title thumbnail")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, payments, "Payment history retrieved successfully")
  );
});

export const getRazorpayKey = asyncHandler(async (_, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new ApiError(500, "Razorpay Key ID is not configured");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        key_id: keyId,
        keyId: keyId,
      },
      "Razorpay Key ID fetched successfully"
    )
  );
});
