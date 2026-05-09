import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";
import { getHeaders } from "@/utils/getHeaders";

// 🔹 Get user profile
export const getUserProfile = createAsyncThunk(
  "user/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        return rejectWithValue("Please login to continue");
      }

      const res = await api.get("/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = res.data?.data;

      console.log("Get user profile success:", user);
      return user;

    } catch (err) {
      console.error("Get user profile error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // optional: redirect login
        window.location.href = "/login";
      }

      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch profile"
      );
    }
  }
);

// 🔹 Get all users
export const getAllUsers = createAsyncThunk(
  "user/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/users", {
        headers: getHeaders(),
      });

      const users = res.data.data;

      console.log("Get all users success:", users);
      return users;
    } catch (err) {
      console.error("Get all users error:", err);
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

// 🔹 Get user by ID
export const getUserById = createAsyncThunk(
  "user/getById",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/users/${userId}`, {
        headers: getHeaders(),
      });

      const user = res.data.data;

      console.log("Get user by ID success:", user);
      return user;
    } catch (err) {
      console.error("Get user by ID error:", err);
      return rejectWithValue(
        err.response?.data?.message || "User not found"
      );
    }
  }
);

export const logout = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");

      // CALL BACKEND
      if (token) {
        await api.post("/auth/logout", null, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // ALWAYS clear FE
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      console.log("Logout success (FE + BE)");
      return true;

    } catch (err) {
      console.error("Logout error:", err);

      // Clear FE (fail-safe)
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      return rejectWithValue(
        err.response?.data?.message || "Logout failed"
      );
    }
  }
);