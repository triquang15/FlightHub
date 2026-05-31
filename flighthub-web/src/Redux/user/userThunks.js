import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "@/utils/api";
import { clearAuthTokens, getRefreshToken } from "@/utils/authStorage";
import { clearUserState } from "./userSlice";
import { logoutLocal } from "../auth/authSlice";

// ============================
// HELPER
// ============================
const getError = (err) =>
  err.response?.data?.message || "Unexpected error";

// ============================
// GET PROFILE
// ============================
export const getUserProfile = createAsyncThunk(
  "user/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/users/profile");
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// ============================
// UPDATE PROFILE
// ============================
export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const res = await api.put("/api/users/profile", profileData);
      toast.success("Profile updated successfully");
      return res.data?.data;
    } catch (err) {
      const message = getError(err) || "Failed to update profile";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ============================
// CHANGE PASSWORD
// ============================
export const changePassword = createAsyncThunk(
  "user/changePassword",
  async (passwordData, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/api/users/change-password", passwordData);
      clearAuthTokens();
      dispatch(clearUserState());
      dispatch(logoutLocal());
      toast.success("Password changed successfully. Please sign in again.");
      setTimeout(() => {
        window.location.assign("/login");
      }, 900);
      return res.data?.data;
    } catch (err) {
      const message = getError(err) || "Failed to update password";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ============================
// GET ALL USERS
// ============================
export const getAllUsers = createAsyncThunk(
  "user/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/users");

      return res.data?.data?.content || [];

    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

// ============================
// GET USER BY ID
// ============================
export const getUserById = createAsyncThunk(
  "user/getById",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/users/${userId}`);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// ============================
// LOGOUT
// ============================
export const logout = createAsyncThunk(
  "user/logout",
  async (_, { dispatch }) => {
    try {
      const refreshToken = getRefreshToken();

      // Send refresh token so backend can invalidate it gracefully
      await api.post("/auth/logout", { refreshToken });
    } catch (err) {
      console.warn("Logout API failed, fallback local logout", err);
      toast.error("Logout failed on server, signing out locally");
    }

    clearAuthTokens();

    dispatch(clearUserState());
    dispatch(logoutLocal());

    toast.success("You have been logged out");
    return true;
  }
);
