import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { login, signup, forgotPassword, resetPassword } from "./authThunk";
import { getUserProfile, updateUserProfile, logout } from "../user/userThunks";

// ================= INIT USER =================
const getInitialUser = () => {
  const token = localStorage.getItem("accessToken");

  if (!token) return null;

  try {
    const decoded = jwtDecode(token);

    return {
      email: decoded.sub,
      role: decoded.roles?.[0],
      id: decoded.userId,
    };
  } catch {
    return null;
  }
};

const initialState = {
  user: getInitialUser(),
  isAuthenticated: !!localStorage.getItem("accessToken"),
  loading: false,
  error: null,

  forgotPasswordLoading: false,
  forgotPasswordError: null,
  forgotPasswordSuccess: false,

  resetPasswordLoading: false,
  resetPasswordError: null,
  resetPasswordSuccess: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearForgotPasswordState: (state) => {
      state.forgotPasswordLoading = false;
      state.forgotPasswordError = null;
      state.forgotPasswordSuccess = false;
    },
    clearResetPasswordState: (state) => {
      state.resetPasswordLoading = false;
      state.resetPasswordError = null;
      state.resetPasswordSuccess = false;
    },
    logoutLocal: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder

      // ================= SIGNUP =================
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= LOGIN =================
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= PROFILE =================
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })

      // ================= LOGOUT =================
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const {
  clearForgotPasswordState,
  clearResetPasswordState,
  logoutLocal,
} = authSlice.actions;

export default authSlice.reducer;
