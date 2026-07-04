import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";
import { getApiErrorMessage, unwrapApiData } from "@/utils/flightOps";

const API_URL = "/api/ancillaries";

const rejectAncillaryError = (err, rejectWithValue, fallback) =>
  rejectWithValue(getApiErrorMessage(err, fallback));

export const createAncillary = createAsyncThunk(
  "ancillary/create",
  async (data, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.post(API_URL, data));
    } catch (err) {
      return rejectAncillaryError(err, rejectWithValue, "Failed to create ancillary");
    }
  },
);

export const getAncillaryById = createAsyncThunk(
  "ancillary/getById",
  async (id, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/${id}`));
    } catch (err) {
      return rejectAncillaryError(err, rejectWithValue, "Ancillary not found");
    }
  },
);

export const getAllAncillaries = createAsyncThunk(
  "ancillary/getAll",
  async (_, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(API_URL));
    } catch (err) {
      return rejectAncillaryError(err, rejectWithValue, "Failed to fetch ancillaries");
    }
  },
);

export const updateAncillary = createAsyncThunk(
  "ancillary/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.put(`${API_URL}/${id}`, data));
    } catch (err) {
      return rejectAncillaryError(err, rejectWithValue, "Failed to update ancillary");
    }
  },
);

export const deleteAncillary = createAsyncThunk(
  "ancillary/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      return id;
    } catch (err) {
      return rejectAncillaryError(err, rejectWithValue, "Failed to delete ancillary");
    }
  },
);
