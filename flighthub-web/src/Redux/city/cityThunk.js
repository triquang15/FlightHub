import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";

// ============================
// CREATE CITY
// ============================
export const createCity = createAsyncThunk(
  "city/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/cities", payload);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Create city failed"
      );
    }
  }
);

// ============================
// GET BY ID
// ============================
export const getCityById = createAsyncThunk(
  "city/getById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/cities/${id}`);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "City not found"
      );
    }
  }
);

// ============================
// GET ALL (PAGINATION)
// ============================
export const getAllCities = createAsyncThunk(
  "city/getAll",
  async ({ page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/cities", {
        params: { page, size },
      });

      return {
        content: res.data?.data?.content || [],
        total: res.data?.data?.totalElements || 0,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Load cities failed"
      );
    }
  }
);

// ============================
// DROPDOWN (MAIN FE)
// ============================
export const getCitiesDropdown = createAsyncThunk(
  "city/getDropdown",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/cities/dropdown");
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Load dropdown failed"
      );
    }
  }
);

// ============================
// SEARCH
// ============================
export const searchCities = createAsyncThunk(
  "city/search",
  async ({ keyword = "", page = 0, size = 10 }, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/cities/search", {
        params: { keyword, page, size },
      });

      return res.data?.data?.content || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Search failed"
      );
    }
  }
);

// ============================
// BY COUNTRY
// ============================
export const getCitiesByCountry = createAsyncThunk(
  "city/byCountry",
  async ({ countryCode, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/cities/country/${countryCode}`, {
        params: { page, size },
      });

      return res.data?.data?.content || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Load by country failed"
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
      return res.data?.data;
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