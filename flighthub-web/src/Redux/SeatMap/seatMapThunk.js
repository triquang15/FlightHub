// src/redux/slices/seatMapSlice.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";

const unwrapApiData = (response) => response?.data?.data ?? response?.data;
const getErrorMessage = (err, fallback) =>
  err.response?.data?.message ||
  err.response?.data?.error ||
  err.message ||
  fallback;

// ================= THUNKS =================

// Create Seat Map
export const createSeatMap = createAsyncThunk(
  "seatMap/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/seat-maps", data);
      return unwrapApiData(res);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to create seat map"));
    }
  }
);

// Update Seat Map
export const updateSeatMap = createAsyncThunk(
  "seatMap/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/seat-maps/${id}`, data);
      return unwrapApiData(res);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to update seat map"));
    }
  }
);

// Get Seat Map by Cabin Class
export const getSeatMapsByCabinClass = createAsyncThunk(
  "seatMap/getByCabinClass",
  async (cabinClassId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/seat-maps/cabin-class/${cabinClassId}`);
      return unwrapApiData(res);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch seat map by cabin class"));
    }
  }
);

// Delete Seat Map
export const deleteSeatMap = createAsyncThunk(
  "seatMap/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/seat-maps/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to delete seat map"));
    }
  }
);

