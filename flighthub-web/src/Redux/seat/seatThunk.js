// src/redux/thunks/seatThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";

const API_URL = "/api/seats";
const SEAT_INSTANCE_URL = "/api/seat-instances";

const unwrapApiData = (response) => response?.data?.data ?? response?.data;
const getErrorMessage = (err, fallback) =>
  err.response?.data?.message ||
  err.response?.data?.error ||
  err.message ||
  fallback;

// ---------- UPDATE ----------
export const updateSeat = createAsyncThunk(
  "seat/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`${API_URL}/${id}`, data);
      return unwrapApiData(res);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to update seat"));
    }
  }
);

export const fetchSeatInstancesByFlightInstance = createAsyncThunk(
  "seatInstances/fetchByFlightInstance",
  async (flightInstanceId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${SEAT_INSTANCE_URL}/flight-instance/${flightInstanceId}`);
      return unwrapApiData(res);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch seat inventory"));
    }
  }
);

export const fetchAvailableSeatInstancesByFlightInstance = createAsyncThunk(
  "seatInstances/fetchAvailableByFlightInstance",
  async (flightInstanceId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${SEAT_INSTANCE_URL}/flight-instance/${flightInstanceId}/available`);
      return unwrapApiData(res);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch available seats"));
    }
  }
);

export const holdSeatInstances = createAsyncThunk(
  "seatInstances/hold",
  async ({ flightInstanceId, seatInstanceIds, userId, holdMinutes = 10 }, { rejectWithValue }) => {
    try {
      const res = await api.post(`${SEAT_INSTANCE_URL}/hold`, {
        flightInstanceId,
        seatInstanceIds,
        userId,
        holdMinutes,
      });
      return unwrapApiData(res);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to hold selected seats"));
    }
  }
);

export const releaseSeatInstances = createAsyncThunk(
  "seatInstances/release",
  async ({ seatInstanceIds, holdToken, bookingReference }, { rejectWithValue }) => {
    try {
      const res = await api.post(`${SEAT_INSTANCE_URL}/release`, {
        seatInstanceIds,
        holdToken,
        bookingReference,
      });
      return unwrapApiData(res);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to release selected seats"));
    }
  }
);

export const confirmSeatInstances = createAsyncThunk(
  "seatInstances/confirm",
  async ({ seatInstanceIds, holdToken, bookingReference }, { rejectWithValue }) => {
    try {
      const res = await api.post(`${SEAT_INSTANCE_URL}/confirm`, {
        seatInstanceIds,
        holdToken,
        bookingReference,
      });
      return unwrapApiData(res);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to confirm selected seats"));
    }
  }
);
