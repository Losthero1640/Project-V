import React, { createContext, useState, useEffect, useContext } from "react";
import { api } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/current-user");
      // Check structure, res.data is ApiResponse, data is inside res.data.data
      if (res.data && res.data.data) {
        setUser(res.data.data);
      } else {
        setUser(null);
      }
      setError(null);
    } catch (err) {
      setUser(null);
      // Mute errors on startup (means user is just not logged in yet)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    // Listen to token expiration event from Axios interceptor
    const handleAuthExpired = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {};
      if (emailOrUsername.includes("@")) {
        payload.email = emailOrUsername;
      } else {
        payload.username = emailOrUsername;
      }
      payload.password = password;

      const res = await api.post("/users/login", payload);
      const data = res.data.data;
      setUser(data.user);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post("/users/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Registration failed. Try again.";
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await api.post("/users/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const updateAvatar = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.patch("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUser(res.data.data);
      return res.data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to update avatar.";
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateCoverImage = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("coverImage", file);
      const res = await api.patch("/users/cover-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUser(res.data.data);
      return res.data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to update cover image.";
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        fetchCurrentUser,
        updateAvatar,
        updateCoverImage,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
