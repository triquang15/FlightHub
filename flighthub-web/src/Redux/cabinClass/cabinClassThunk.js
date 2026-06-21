// src/redux/slices/cabinClassSlice.js

import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";

const getErrorMessage = (err, fallback) => {
  const data = err.response?.data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (Array.isArray(data?.errors)) return data.errors.join(", ");
  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).filter(Boolean).join(", ");
  }
  return fallback;
};

const unwrapResponse = (response) => response.data?.data ?? response.data;

// ================= THUNKS =================

// Create Cabin Class
export const createCabinClass = createAsyncThunk(
  "cabinClass/create",
  async (cabinClassData, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/cabin-classes", cabinClassData);
      console.log("✅ createCabinClass success:", res.data);
      return unwrapResponse(res);
    } catch (err) {
      console.error("❌ createCabinClass error:", err.response?.data?.message || err.message);
      return rejectWithValue(getErrorMessage(err, "Failed to create cabin class"));
    }
  }
);

// Get Cabin Class by ID
export const getCabinClassById = createAsyncThunk(
  "cabinClass/getById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/cabin-classes/${id}`);
      console.log("✅ getCabinClassById success:", res.data);
      return unwrapResponse(res);
    } catch (err) {
      console.error("❌ getCabinClassById error:", err.response?.data?.message || err.message);
      return rejectWithValue(getErrorMessage(err, "Cabin class not found"));
    }
  }
);

// Get Cabin Classes by Aircraft
export const getCabinClassesByAircraft = createAsyncThunk(
  "cabinClass/getByAircraft",
  async (aircraftId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/cabin-classes/aircraft/${aircraftId}`);
      console.log("✅ getCabinClassesByAircraft success:", res.data);
      return unwrapResponse(res);
    } catch (err) {
      console.error("❌ getCabinClassesByAircraft error:", err.response?.data?.message || err.message);
      return rejectWithValue(getErrorMessage(err, "Failed to fetch cabin classes for aircraft"));
    }
  }
);

// Update Cabin Class
export const updateCabinClass = createAsyncThunk(
  "cabinClass/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/cabin-classes/${id}`, data);
      console.log("✅ updateCabinClass success:", res.data);
      return unwrapResponse(res);
    } catch (err) {
      console.error("❌ updateCabinClass error:", err.response?.data?.message || err.message);
      return rejectWithValue(getErrorMessage(err, "Failed to update cabin class"));
    }
  }
);

// Delete Cabin Class
export const deleteCabinClass = createAsyncThunk(
  "cabinClass/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/cabin-classes/${id}`);
      console.log("✅ deleteCabinClass success:", id);
      return id;
    } catch (err) {
      console.error("❌ deleteCabinClass error:", err.response?.data?.message || err.message);
      return rejectWithValue(getErrorMessage(err, "Failed to delete cabin class"));
    }
  }
);


