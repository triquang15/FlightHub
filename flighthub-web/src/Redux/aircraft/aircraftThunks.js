import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";

const getAircraftErrorMessage = (err, fallback) => {
  const data = err.response?.data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).filter(Boolean).join(", ");
  }
  if (Array.isArray(data?.errors)) return data.errors.join(", ");
  return fallback;
};

// ✅ Create Aircraft
export const createAircraft = createAsyncThunk(
  "aircraft/create",
  async (aircraftData, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/aircrafts", aircraftData);
      console.log("Create aircraft success:", res.data);
      return res.data?.data ?? res.data;
    } catch (err) {
      console.error("Create aircraft error:", err);
      return rejectWithValue(getAircraftErrorMessage(err, "Failed to create aircraft"));
    }
  }
);

// ✅ Get Aircraft by ID
export const getAircraftById = createAsyncThunk(
  "aircraft/getById",
  async (aircraftId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/aircrafts/${aircraftId}`);
      console.log("Get aircraft by ID success:", res.data);
      return res.data?.data ?? res.data;
    } catch (err) {
      console.error("Get aircraft by ID error:", err);
      return rejectWithValue(
        err.response?.data?.message || "Aircraft not found"
      );
    }
  }
);

// ✅ List All Aircrafts
export const listAllAircrafts = createAsyncThunk(
  "aircraft/listAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/aircrafts", {
        params
      });
      console.log("List all aircrafts success:", res.data);
      return res.data?.data ?? res.data;
    } catch (err) {
      console.error("List all aircrafts error:", err);
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch aircrafts"
      );
    }
  }
);





export const getAircraftFleetSummary = createAsyncThunk(
  "aircraft/getFleetSummary",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/aircrafts/summary");
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch fleet summary"
      );
    }
  }
);

export const listAircraftOptions = createAsyncThunk(
  "aircraft/listOptions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/aircrafts/dropdown");
      return res.data?.data ?? [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch aircraft options"
      );
    }
  }
);

// ✅ Update Aircraft
export const updateAircraft = createAsyncThunk(
  "aircraft/update",
  async ({ aircraftId, aircraftData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/aircrafts/${aircraftId}`, aircraftData);
      console.log("Update aircraft success:", res.data);
      return res.data?.data ?? res.data;
    } catch (err) {
      console.error("Update aircraft error:", err);
      return rejectWithValue(getAircraftErrorMessage(err, "Failed to update aircraft"));
    }
  }
);

// ✅ Delete Aircraft
export const deleteAircraft = createAsyncThunk(
  "aircraft/delete",
  async (aircraftId, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/api/aircrafts/${aircraftId}`);
      console.log("Delete aircraft success:", res.data);
      return aircraftId;
    } catch (err) {
      console.error("Delete aircraft error:", err);
      return rejectWithValue(getAircraftErrorMessage(err, "Failed to delete aircraft"));
    }
  }
);
