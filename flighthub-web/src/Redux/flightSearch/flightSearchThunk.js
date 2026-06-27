import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";

const API_URL = "/api/flights/search";

// ✅ Search Flights (Direct, Connecting, Via)
export const searchFlightsAvailability = createAsyncThunk(
  "flightSearch/search",
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get(API_URL, {
        params,
      });

      // Flight search uses the platform-wide ApiResponse<Page<...>> envelope.
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to search flights right now",
      );
    }
  },
);
