import { createSlice } from "@reduxjs/toolkit";
import {
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  deleteUserAvatar,
  getAllUsers,
  getUserById,
  logout
} from "./userThunks";

const initialState = {
  userProfile: null,
  users: [],
  total: 0,
  totalPages: 1,
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
      state.total = 0;
      state.totalPages = 1;
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
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.profileError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.userProfile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.profileError = action.payload;
      })
      .addCase(uploadUserAvatar.pending, (state) => {
        state.loading = true;
        state.profileError = null;
      })
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        state.loading = false;
        state.userProfile = action.payload;
      })
      .addCase(uploadUserAvatar.rejected, (state, action) => {
        state.loading = false;
        state.profileError = action.payload;
      })
      .addCase(deleteUserAvatar.pending, (state) => {
        state.loading = true;
        state.profileError = null;
      })
      .addCase(deleteUserAvatar.fulfilled, (state, action) => {
        state.loading = false;
        state.userProfile = action.payload;
      })
      .addCase(deleteUserAvatar.rejected, (state, action) => {
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
        if (Array.isArray(action.payload)) {
          state.users = action.payload;
          state.total = action.payload.length;
          state.totalPages = 1;
          return;
        }

        state.users = action.payload?.content || [];
        state.total = action.payload?.totalElements || 0;
        state.totalPages = action.payload?.totalPages || 1;
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
        state.total = 0;
        state.totalPages = 1;
        state.profileError = null;
        state.usersError = null;
      });
  },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;
