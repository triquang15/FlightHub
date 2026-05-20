import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";

// ============================
// GET ALL (PAGINATION + FILTER + SEARCH)
// ============================
export const getAllCities = createAsyncThunk(
  "city/getAll",
  async (
    {
      page = 0,
      size = 20,
      sortBy = "name",
      sortDirection = "asc",
      keyword,
      country,
      timezone,
      region
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.get("/api/cities", {
        params: {
          page,
          size,
          sortBy,
          sortDirection,
          keyword,
          country,
          timezone,
          region,
        },
      });

      return res.data;

    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Load cities failed"
      );
    }
  }
);

// ============================
// CREATE
// ============================
export const createCity = createAsyncThunk(
  "city/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/cities", payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Create failed"
      );
    }
  }
);

// ============================
// UPDATE
// ============================
export const updateCity = createAsyncThunk(
  "city/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/cities/${id}`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Update failed"
      );
    }
  }
);

// ============================
// DELETE
// ============================
export const deleteCity = createAsyncThunk(
  "city/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/cities/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Delete failed"
      );
    }
  }
);

// ============================
// GET TIMEZONES
// ============================
export const getTimezones = createAsyncThunk(
  "city/getTimezones",
  async ({ keyword, region } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/cities/timezones", {
        params: { keyword, region },
      });

      return res.data;

    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Load timezones failed"
      );
    }
  }
);