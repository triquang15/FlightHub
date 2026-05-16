import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";
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
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout API failed, fallback local logout");
    }

    localStorage.clear();

    dispatch(clearUserState());
    dispatch(logoutLocal());

    return true;
  }
);