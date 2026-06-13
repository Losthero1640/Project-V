import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies along with requests
});

// Response interceptor to handle token expiry (401 errors)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) and we haven't retried yet
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/users/login" &&
      originalRequest.url !== "/users/register" &&
      originalRequest.url !== "/users/refresh-token"
    ) {
      originalRequest._retry = true;

      try {
        // Call the refresh-token endpoint (cookies are sent automatically)
        await axios.post(
          `${API_BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true }
        );

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, token is completely invalid/expired, redirect to login or clear auth state
        console.error("Refresh token expired or invalid", refreshError);
        
        // Dispatch custom event to let AuthContext know to log out
        window.dispatchEvent(new Event("auth-expired"));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
