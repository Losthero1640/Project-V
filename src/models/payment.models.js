import mongoose, { Schema } from "mongoose";

// Payment transaction schema for Premium and Super Thanks
const paymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    type: {
      type: String,
      enum: ["SUPER_THANKS", "SUPER_CHAT", "PREMIUM_SUBSCRIPTION", "CUSTOM_PAYMENT", "ORDER"],
      default: "ORDER",
    },
    amount: {
      type: Number, // Amount in paise
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: String,
    },
    signature: {
      type: String,
    },
    notes: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model("Payment", paymentSchema);
