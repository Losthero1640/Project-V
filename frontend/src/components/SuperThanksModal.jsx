import React, { useState } from "react";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import "./SuperThanksModal.css";

export const SuperThanksModal = ({ video, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const presetAmounts = [50, 100, 200, 500];

  const handlePay = async () => {
    const finalAmountInRupees = customAmount ? parseFloat(customAmount) : selectedAmount;

    if (!finalAmountInRupees || finalAmountInRupees < 1) {
      setErrorMsg("Please enter a valid amount (Minimum ₹1)");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        setErrorMsg("Failed to load Razorpay SDK. Please check your internet connection.");
        setLoading(false);
        return;
      }

      const orderRes = await api.post("/payments/create-order", {
        type: "SUPER_THANKS",
        amount: finalAmountInRupees,
        recipientId: video?.owner?._id,
        videoId: video?._id,
      });

      const orderData = orderRes.data?.data;
      if (!orderData) {
        throw new Error("Could not retrieve order details from server.");
      }

      const orderId = orderData.order_id || orderData.orderId;
      const amountInPaise = orderData.amount;
      const currency = orderData.currency || "INR";
      const keyId = orderData.key_id || orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: currency,
        name: "VidTube Super Thanks",
        description: `Support @${video?.owner?.username || "Creator"} for "${video?.title || "Video"}"`,
        order_id: orderId,
        handler: async function (response) {
          try {
            setLoading(true);
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

            const verifyRes = await api.post("/payments/verify", {
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
            });

            if (verifyRes.data?.success) {
              setSuccessMsg(`🎉 Super Thanks of ₹${finalAmountInRupees} sent successfully!`);
              if (onSuccess) onSuccess(finalAmountInRupees);
            } else {
              setErrorMsg(verifyRes.data?.message || "Payment verification failed.");
            }
          } catch (err) {
            setErrorMsg(
              err.response?.data?.message || "Payment verification failed on server."
            );
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.fullName || user?.username || "VidTube Supporter",
          email: user?.email || "",
        },
        notes: {
          videoId: video?._id || "",
          recipientId: video?.owner?._id || "",
          type: "SUPER_THANKS",
        },
        theme: {
          color: "#ff7e5f",
        },
        method: {
          netbanking: true,
          card: true,
          upi: true,
          wallet: true,
          paylater: true,
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", function (response) {
        setLoading(false);
        const description = response.error?.description || "Payment process failed.";
        setErrorMsg(`Payment Failed: ${description}`);
      });

      razorpayInstance.open();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Could not initiate payment order.");
      setLoading(false);
    }
  };

  return (
    <div className="super-thanks-overlay" onClick={onClose}>
      <div className="super-thanks-card" onClick={(e) => e.stopPropagation()}>
        <div className="super-thanks-header">
          <h3>💖 Super Thanks</h3>
          <button className="super-thanks-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {successMsg ? (
          <div className="super-thanks-success">
            <div className="super-thanks-success-icon">🎉</div>
            <h4 style={{ margin: "0 0 10px 0" }}>{successMsg}</h4>
            <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
              Your tip supports creator <strong>@{video?.owner?.username}</strong>!
            </p>
            <button className="super-thanks-submit" onClick={onClose} style={{ marginTop: 20 }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="super-thanks-subtitle">
              Show extra appreciation to <strong>@{video?.owner?.username || "creator"}</strong> for this video!
            </p>

            <div className="super-thanks-options">
              {presetAmounts.map((amt) => (
                <button
                  key={amt}
                  className={`amount-btn ${selectedAmount === amt && !customAmount ? "active" : ""}`}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <input
              type="number"
              className="custom-amount-input"
              placeholder="Or enter custom amount in ₹"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min="1"
            />

            {errorMsg && (
              <p style={{ color: "#ff4d4d", fontSize: "0.85rem", marginBottom: 15, textAlign: "center" }}>
                {errorMsg}
              </p>
            )}

            <button
              className="super-thanks-submit"
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? "Processing..." : `Send Super Thanks (₹${customAmount || selectedAmount})`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
