import api from "@/utils/api";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { setAuthTokens } from "@/utils/authStorage";


export const signup = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/auth/signup", userData);

      const authResponse = res.data.data;

      // save tokens
      setAuthTokens(authResponse, true);

      console.log("Signup success:", authResponse);

      return authResponse;
    } catch (err) {
      console.error("Signup error:", err);

      return rejectWithValue(
        err.response?.data?.message || "Signup failed"
      );
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    console.log("Credentials:", credentials);

    try {
      const { rememberMe = false, ...loginData } = credentials;
      const res = await api.post("/api/auth/login", loginData);

      const authResponse = res.data.data;

      console.log("Login success:", authResponse);

      setAuthTokens(authResponse, rememberMe);

      toast.success("Logged in successfully");

      return authResponse;
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.response?.data?.message || "Login failed");

      return rejectWithValue(
        err.response?.data?.message || "Login failed"
      );
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async ({ idToken, rememberMe = true }, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/auth/google", { idToken });
      const authResponse = res.data.data;

      setAuthTokens(authResponse, rememberMe);
      toast.success("Logged in with Google");

      return authResponse;
    } catch (err) {
      console.error("Google login error:", err);
      const message = err.response?.data?.message || "Google login failed";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const facebookLogin = createAsyncThunk(
  "auth/facebookLogin",
  async ({ accessToken, rememberMe = true }, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/auth/facebook", { accessToken });
      const authResponse = res.data.data;

      setAuthTokens(authResponse, rememberMe);
      toast.success("Logged in with Facebook");

      return authResponse;
    } catch (err) {
      console.error("Facebook login error:", err);
      const message = err.response?.data?.message || "Facebook login failed";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ✅ Forgot Password
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const res = await api.post("/api/users/forgot-password", { email: normalizedEmail });
      console.log("Forgot password success:", res.data);
      return res.data;
    } catch (err) {
      console.error("Forgot password error:", err);
      return rejectWithValue(err.response?.data?.message || "Failed to send reset email");
    }
  }
);

// ✅ Reset Password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/users/reset-password", { token: String(token || "").trim(), newPassword });
      console.log("Reset password success:", res.data);
      return res.data;
    } catch (err) {
      console.error("Reset password error:", err);
      return rejectWithValue(err.response?.data?.message || "Failed to reset password");
    }
  }
);
