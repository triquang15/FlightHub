import { createSlice } from '@reduxjs/toolkit';
import {
  createAircraft,
  getAircraftById,
  listAllAircrafts,
  getAircraftFleetSummary,
  listAircraftOptions,
  updateAircraft,
  deleteAircraft,
} from './aircraftThunks';

const initialState = {
  // Data
  aircrafts: [],
  currentAircraft: null,
  paginatedAircrafts: {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: false,
    numberOfElements: 0
  },
  fleetSummary: {
    totalAircraft: 0,
    activeAircraft: 0,
    maintenanceAircraft: 0,
    totalSeats: 0
  },
  aircraftOptions: [],
  
  // UI State
  loading: false,
  error: null,
  
  // Filters and Search
  searchKeyword: '',
  statusFilter: 'all',
  airlineFilter: '',
  
  // Pagination
  currentPage: 0,
  pageSize: 10,
  sortBy: 'code',
  sortDirection: 'asc',
  
  // Validation
  validationErrors: {},
  
  // Specific loading states
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  searchLoading: false,
  validationLoading: false,
  latestListRequestId: null,
};

const createAircraftPage = (payload, pageSize) => {
  if (payload?.content && Array.isArray(payload.content)) {
    return payload;
  }

  const content = Array.isArray(payload) ? payload : [];

  return {
    content,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
    size: pageSize,
    number: 0,
    first: true,
    last: true,
    numberOfElements: content.length
  };
};

const aircraftSlice = createSlice({
  name: 'aircraft',
  initialState,
  reducers: {
    clearAircraftState: (state) => {
      state.aircrafts = [];
      state.currentAircraft = null;
      state.paginatedAircrafts = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: false,
        numberOfElements: 0
      };
      state.error = null;
      state.validationErrors = {};
    },
    clearCurrentAircraft: (state) => {
      state.currentAircraft = null;
    },
    setSearchKeyword: (state, action) => {
      state.searchKeyword = action.payload;
      state.currentPage = 0;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setAirlineFilter: (state, action) => {
      state.airlineFilter = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
      state.currentPage = 0;
    },
    setSortDirection: (state, action) => {
      state.sortDirection = action.payload;
      state.currentPage = 0;
    },
    setValidationErrors: (state, action) => {
      state.validationErrors = action.payload;
    },
    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Aircraft
      .addCase(createAircraft.pending, (state) => {
        state.loading = true;
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createAircraft.fulfilled, (state, action) => {
        state.loading = false;
        state.createLoading = false;
        state.currentAircraft = action.payload;
        state.aircrafts.unshift(action.payload);
      })
      .addCase(createAircraft.rejected, (state, action) => {
        state.loading = false;
        state.createLoading = false;
        state.error = action.payload;
      })
      
      // Get Aircraft by ID
      .addCase(getAircraftById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAircraftById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAircraft = action.payload;
      })
      .addCase(getAircraftById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // List All Aircrafts
      .addCase(listAllAircrafts.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.latestListRequestId = action.meta.requestId;
      })
      .addCase(listAllAircrafts.fulfilled, (state, action) => {
        if (state.latestListRequestId !== action.meta.requestId) return;
        state.loading = false;
        const page = createAircraftPage(action.payload, state.pageSize);
        state.paginatedAircrafts = page;
        state.aircrafts = page.content;
        state.currentPage = page.number;
      })
      .addCase(listAllAircrafts.rejected, (state, action) => {
        if (state.latestListRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getAircraftFleetSummary.fulfilled, (state, action) => {
        state.fleetSummary = action.payload;
      })

      .addCase(listAircraftOptions.fulfilled, (state, action) => {
        state.aircraftOptions = Array.isArray(action.payload) ? action.payload : [];
      })

      // Update Aircraft
      .addCase(updateAircraft.pending, (state) => {
        state.loading = true;
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateAircraft.fulfilled, (state, action) => {
        state.loading = false;
        state.updateLoading = false;
        state.currentAircraft = action.payload;
        // Update in aircrafts array
        const index = state.aircrafts.findIndex(aircraft => aircraft.id === action.payload.id);
        if (index !== -1) {
          state.aircrafts[index] = action.payload;
        }
        // Update in paginated aircrafts
        const paginatedIndex = state.paginatedAircrafts.content.findIndex(aircraft => aircraft.id === action.payload.id);
        if (paginatedIndex !== -1) {
          state.paginatedAircrafts.content[paginatedIndex] = action.payload;
        }
      })
      .addCase(updateAircraft.rejected, (state, action) => {
        state.loading = false;
        state.updateLoading = false;
        state.error = action.payload;
      })
      
      // Delete Aircraft
      .addCase(deleteAircraft.pending, (state) => {
        state.loading = true;
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteAircraft.fulfilled, (state, action) => {
        state.loading = false;
        state.deleteLoading = false;
        // Remove from aircrafts array
        state.aircrafts = state.aircrafts.filter(aircraft => aircraft.id !== action.payload);
        // Remove from paginated aircrafts
        state.paginatedAircrafts.content = state.paginatedAircrafts.content.filter(aircraft => aircraft.id !== action.payload);
        if (state.paginatedAircrafts.totalElements > 0) {
          state.paginatedAircrafts.totalElements -= 1;
        }
        if (state.paginatedAircrafts.numberOfElements > 0) {
          state.paginatedAircrafts.numberOfElements -= 1;
        }
      })
      .addCase(deleteAircraft.rejected, (state, action) => {
        state.loading = false;
        state.deleteLoading = false;
        state.error = action.payload;
      })
      
     
      
      // Global error matcher (following the airline pattern)
      .addMatcher(
        (action) => action.type.startsWith('aircraft/') && action.type.endsWith('/rejected'),
        (state, action) => {
          if (
            action.type === listAllAircrafts.rejected.type
            && state.latestListRequestId !== action.meta.requestId
          ) {
            return;
          }
          state.error = action.payload;
        }
      );
  },
});

export const {
  clearAircraftState,
  clearCurrentAircraft,
  setSearchKeyword,
  setStatusFilter,
  setAirlineFilter,
  setCurrentPage,
  setPageSize,
  setSortBy,
  setSortDirection,
  setValidationErrors,
  clearValidationErrors
} = aircraftSlice.actions;

export default aircraftSlice.reducer;
