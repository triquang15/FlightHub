import { createSlice } from "@reduxjs/toolkit";
import {
  getUserProfile,
  getAllUsers,
  getUserById,
  logout
} from "./userThunks";

const initialState = {
  userProfile: null,
  users: [],
  selectedUser: null,
  loading: false,
  usersLoading: false,
  profileError: null,
  usersError: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserState: (state) => {
      state.userProfile = null;
      state.users = [];
      state.selectedUser = null;
      state.profileError = null;
      state.usersError = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // ================= PROFILE =================
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.profileError = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.userProfile = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.profileError = action.payload;
      })

      // ================= USERS =================
      .addCase(getAllUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload;
      })

      // ================= USER BY ID =================
      .addCase(getUserById.fulfilled, (state, action) => {
        state.selectedUser = action.payload;
      })

      // ================= LOGOUT =================
      .addCase(logout.fulfilled, (state) => {
        state.userProfile = null;
        state.selectedUser = null;
        state.users = [];
        state.profileError = null;
        state.usersError = null;
      });
  },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;