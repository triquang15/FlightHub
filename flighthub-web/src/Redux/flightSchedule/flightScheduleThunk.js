import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";

const API_URL = "/api/flight-schedules";

// ---------- CREATE ----------
export const createFlightSchedule = createAsyncThunk(
  "flightSchedule/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(API_URL, data);
      console.log("✅ createFlightSchedule success:", res.data);
      return res.data;
    } catch (err) {
      console.error("❌ createFlightSchedule error:", 
        err.response);
      return rejectWithValue(err.response?.data?.message || "Failed to create flight schedule");
    }
  }
);

// ---------- GET BY ID ----------
export const getFlightScheduleById = createAsyncThunk(
  "flightSchedule/getById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}/${id}`);
      console.log("✅ getFlightScheduleById success:", res.data);
      return res.data;
    } catch (err) {
      console.error("❌ getFlightScheduleById error:", err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || "Flight schedule not found");
    }
  }
);

// ---------- GET ALL ----------
export const getAllFlightSchedules = createAsyncThunk(
  "flightSchedule/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(API_URL);
      console.log("✅ getAllFlightSchedules success:", res.data);
      return res.data;
    } catch (err) {
      console.error("❌ getAllFlightSchedules error:", err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || "Failed to fetch flight schedules");
    }
  }
);

// ---------- UPDATE ----------
export const updateFlightSchedule = createAsyncThunk(
  "flightSchedule/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`${API_URL}/${id}`, data);
      console.log("✅ updateFlightSchedule success:", res.data);
      return res.data;
    } catch (err) {
      console.error("❌ updateFlightSchedule error:", err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || "Failed to update flight schedule");
    }
  }
);

// ---------- DELETE ----------
export const deleteFlightSchedule = createAsyncThunk(
  "flightSchedule/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      console.log("✅ deleteFlightSchedule success:", id);
      return id;
    } catch (err) {
      console.error("❌ deleteFlightSchedule error:", err.response?.data?.message || err.message);
      return rejectWithValue(err.response?.data?.message || "Failed to delete flight schedule");
    }
  }
);

