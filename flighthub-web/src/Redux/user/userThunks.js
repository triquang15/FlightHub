import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";
import { clearUserState } from "./userSlice";
import { logoutLocal } from "../auth/authSlice";

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
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch profile"
      );
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
      return res.data?.data;
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
      return rejectWithValue(
        err.response?.data?.message || "User not found"
      );
    }
  }
);

// ============================
// LOGOUT
// ============================
export const logout = createAsyncThunk(
  "user/logout",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (token) {
        await api.post("/auth/logout");
      }

      // clear storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // clear redux
      dispatch(clearUserState());
      dispatch(logoutLocal());

      return true;

    } catch (err) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      dispatch(clearUserState());
      dispatch(logoutLocal());

      return rejectWithValue(
        err.response?.data?.message || "Logout failed"
      );
    }
  }
);