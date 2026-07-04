import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";
import { getApiErrorMessage, unwrapApiData } from "@/utils/flightOps";

const API_URL = "/api/baggage-policies";

const rejectBaggageError = (err, rejectWithValue, fallback) =>
  rejectWithValue(getApiErrorMessage(err, fallback));

export const createPolicy = createAsyncThunk(
  "baggagePolicy/create",
  async (data, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.post(API_URL, data));
    } catch (err) {
      return rejectBaggageError(err, rejectWithValue, "Failed to create baggage policy");
    }
  },
);

export const getPolicyById = createAsyncThunk(
  "baggagePolicy/getById",
  async (id, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/${id}`));
    } catch (err) {
      return rejectBaggageError(err, rejectWithValue, "Baggage policy not found");
    }
  },
);

export const updatePolicy = createAsyncThunk(
  "baggagePolicy/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.put(`${API_URL}/${id}`, data));
    } catch (err) {
      return rejectBaggageError(err, rejectWithValue, "Failed to update baggage policy");
    }
  },
);

export const deletePolicy = createAsyncThunk(
  "baggagePolicy/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      return id;
    } catch (err) {
      return rejectBaggageError(err, rejectWithValue, "Failed to delete baggage policy");
    }
  },
);

export const getPolicyByAirline = createAsyncThunk(
  "baggagePolicy/getByAirline",
  async (airlineId, { rejectWithValue }) => {
    try {
      if (!airlineId) {
        return rejectWithValue("Airline profile is required before loading baggage policies");
      }
      return unwrapApiData(await api.get(`${API_URL}/airline/${airlineId}`));
    } catch (err) {
      return rejectBaggageError(err, rejectWithValue, "Failed to fetch baggage policies");
    }
  },
);

export const getBaggagePolicyByFare = createAsyncThunk(
  "baggagePolicy/getByFare",
  async (fareId, { rejectWithValue }) => {
    try {
      return unwrapApiData(await api.get(`${API_URL}/fare/${fareId}`));
    } catch (err) {
      return rejectBaggageError(err, rejectWithValue, "Policy not found for this fare");
    }
  },
);
