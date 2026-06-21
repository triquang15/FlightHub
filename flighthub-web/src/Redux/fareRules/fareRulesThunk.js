import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";
import { getApiErrorMessage, unwrapApiData } from "@/utils/flightOps";

const API_URL = "/api/fare-rules";

const rejectFareRuleError = (error, rejectWithValue, fallback) =>
  rejectWithValue(getApiErrorMessage(error, fallback));

export const createFareRule = createAsyncThunk(
  "fareRules/create",
  async (fareRuleData, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.post(API_URL, fareRuleData));
    } catch (error) {
      return rejectFareRuleError(error, rejectWithValue, "Failed to create fare rule");
    }
  },
);

export const getAllFareRules = createAsyncThunk(
  "fareRules/getAll",
  async (_, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/airline`));
    } catch (error) {
      return rejectFareRuleError(error, rejectWithValue, "Failed to fetch fare rules");
    }
  },
);

export const getFareRulesByAirline = createAsyncThunk(
  "fareRules/getByAirline",
  async (_, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/airline`));
    } catch (error) {
      return rejectFareRuleError(error, rejectWithValue, "Failed to fetch fare rules");
    }
  },
);

export const getFareRuleById = createAsyncThunk(
  "fareRules/getById",
  async (id, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/${id}`));
    } catch (error) {
      return rejectFareRuleError(error, rejectWithValue, "Fare rule not found");
    }
  },
);

export const updateFareRule = createAsyncThunk(
  "fareRules/update",
  async ({ id, fareRuleData }, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.put(`${API_URL}/${id}`, fareRuleData));
    } catch (error) {
      return rejectFareRuleError(error, rejectWithValue, "Failed to update fare rule");
    }
  },
);

export const deleteFareRule = createAsyncThunk(
  "fareRules/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      return id;
    } catch (error) {
      return rejectFareRuleError(error, rejectWithValue, "Failed to delete fare rule");
    }
  },
);

export const getFareRuleByFare = createAsyncThunk(
  "fareRules/getByFare",
  async (fareId, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/fare/${fareId}`));
    } catch (error) {
      return rejectFareRuleError(error, rejectWithValue, "Failed to fetch fare rule");
    }
  },
);
