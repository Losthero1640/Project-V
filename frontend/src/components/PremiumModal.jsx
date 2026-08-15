import React, { useState } from "react";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import "./PremiumModal.css";

export const PremiumModal = ({ onClose }) => {
  const { user, fetchCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubscribe = async () => {
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
        type: "PREMIUM_SUBSCRIPTION",
        amount: 199,
      });

      const orderData = orderRes.data?.data;
      if (!orderData) {
        throw new Error("Could not retrieve order details from server.");
      }

      const orderId = orderData.order_id || orderData.orderId;
      const amount = orderData.amount;
      const currency = orderData.currency || "INR";
      const keyId = orderData.key_id || orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "VidTube Premium",
        description: "1-Month Premium Subscription Access",
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
              await fetchCurrentUser();
              setSuccessMsg("👑 Welcome to VidTube Premium! Enjoy your exclusive perks.");
            } else {
              setErrorMsg(verifyRes.data?.message || "Payment verification failed.");
            }
          } catch (err) {
            setErrorMsg(
              err.response?.data?.message || "Subscription verification failed on server."
            );
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.fullName || user?.username || "VidTube Member",
          email: user?.email || "",
        },
        notes: {
          subscriptionType: "PREMIUM_SUBSCRIPTION",
        },
        theme: {
          color: "#ffd700",
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
        const description = response.error?.description || "Payment failed. Please try again.";
        setErrorMsg(`Payment Error: ${description}`);
      });

      razorpayInstance.open();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to initiate subscription order.");
      setLoading(false);
    }
  };

  return (
    <div className="premium-overlay" onClick={onClose}>
      <div className="premium-card" onClick={(e) => e.stopPropagation()}>
        <button className="premium-close" onClick={onClose}>
          &times;
        </button>

        <div className="premium-header">
          <div className="premium-badge-icon">👑</div>
          <h2 className="premium-title">VidTube Premium</h2>
          <div className="premium-price">
            Only <span>₹199</span> / month
          </div>
        </div>

        {successMsg ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <h3 style={{ color: "#ffd700", marginBottom: "10px" }}>{successMsg}</h3>
            <p style={{ color: "#aaa" }}>Your account is now upgraded to Premium.</p>
            <button className="premium-btn" onClick={onClose} style={{ marginTop: 20 }}>
              Enjoy Premium Features
            </button>
          </div>
        ) : (
          <>
            <ul className="premium-features">
              <li>
                <span>⚡</span> <strong>Ad-Free Video Streaming</strong>
              </li>
              <li>
                <span>🚀</span> <strong>4K Ultra HD & Background Playback</strong>
              </li>
              <li>
                <span>👑</span> <strong>Exclusive Gold Crown Badge on Channel</strong>
              </li>
              <li>
                <span>💬</span> <strong>Priority Live Stream Chat Highlights</strong>
              </li>
            </ul>

            {errorMsg && (
              <p style={{ color: "#ff4d4d", fontSize: "0.85rem", marginBottom: 15, textAlign: "center" }}>
                {errorMsg}
              </p>
            )}

            <button
              className="premium-btn"
              onClick={handleSubscribe}
              disabled={loading || user?.isPremium}
            >
              {user?.isPremium
                ? "👑 You Are Already Premium!"
                : loading
                ? "Processing..."
                : "Upgrade to Premium (₹199/mo)"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
