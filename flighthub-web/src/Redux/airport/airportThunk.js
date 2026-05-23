import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";

// ============================
// CREATE
// ============================
export const createAirport = createAsyncThunk(
  "airport/create",
  async (airportData, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/airports", airportData);
      return res.data.data; // ✅ ApiResponse
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create airport"
      );
    }
  }
);

// ============================
// GET BY ID
// ============================
export const getAirportById = createAsyncThunk(
  "airport/getById",
  async (airportId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/airports/${airportId}`);
      return res.data.data; // ✅ ApiResponse
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Airport not found"
      );
    }
  }
);

// ============================
// LIST (PAGINATION + FILTER)
// ============================
export const listAllAirports = createAsyncThunk(
  "airport/listAll",
  async (
    {
      page = 0,
      size = 20,
      sortBy = "name",
      sortDirection = "asc",
      keyword,
      country,
      cityId
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.get("/api/airports", {
        params: {
          page,
          size,
          sortBy,
          sortDirection,
          keyword,
          country,
          cityId
        },
        });

      return res.data; // ✅ Page<>
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch airports"
      );
    }
  }
);

// ============================
// UPDATE
// ============================
export const updateAirport = createAsyncThunk(
  "airport/update",
  async ({ airportId, airportData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/airports/${airportId}`, airportData);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update airport"
      );
    }
  }
);

// ============================
// DELETE
// ============================
export const deleteAirport = createAsyncThunk(
  "airport/delete",
  async (airportId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/airports/${airportId}`);
      return airportId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete airport"
      );
    }
  }
);

// ============================
// FETCH TIMEZONES
// ============================
export const fetchTimezones = createAsyncThunk(
  "airport/fetchTimezones",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/cities/timezones");
      return res.data; // ✅ Array<TimezoneResponse>
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch timezones"
      );
    }
  }
);

// ============================
// DETECT TIMEZONE
// ============================
export const detectTimezone = createAsyncThunk(
  "airport/detectTimezone",
  async ({ lat, lng }, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/airports/timezone/detect", {
        params: { lat, lng }
      });
      return res.data.data;
    } catch {
      return rejectWithValue("Cannot detect timezone");
    }
  }
);
