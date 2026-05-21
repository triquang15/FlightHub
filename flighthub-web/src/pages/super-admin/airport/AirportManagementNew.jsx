import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Redux actions
import {

  deleteAirport,
  listAllAirports,

} from '@/Redux/airport/airportThunk';
import { getAllCities } from '@/Redux/city/cityThunk';

// Components
import AirportStatsCards from './components/AirportStatsCards';
import AirportToolbar from './components/AirportToolbar';
import AirportFilters from './components/AirportFilters';
import AirportTable from './components/AirportTable';
import AirportPagination from './components/AirportPagination';
import AirportDeleteModal from './components/AirportDeleteModal';
import AirportNotification from './components/AirportNotification';

const AirportManagementNew = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { airports, total, totalPages, loading, error } = useSelector((state) => state.airport);
  const { cityList = [] } = useSelector((state) => state.city);


  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAirport, setDeletingAirport] = useState(null);
  const [notification, setNotification] = useState(null);

  // Helper functions
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const getStatistics = () => {
    if (!Array.isArray(airports)) {
      return { totalAirports: 0, totalCities: 0, totalTimezones: 0 };
    }
    return {
      totalAirports: total || airports.length,
      totalCities: new Set(airports.map(a => a.city?.name).filter(Boolean)).size,
      totalTimezones: new Set(airports.map(a => a.timeZone).filter(Boolean)).size,
      airportsWithCoordinates: airports.filter(a => a.geoCode?.latitude && a.geoCode?.longitude).length
    };
  };

  const getFilterOptions = () => {
    if (!Array.isArray(airports)) {
      return { countries: [], cities: [] };
    }
    const countries = new Set();

    cityList.forEach(city => {
      if (city.countryName && city.countryCode) {
        countries.add(JSON.stringify({ name: city.countryName, code: city.countryCode }));
      }
    });

    return {
      countries: Array.from(countries).map(country => JSON.parse(country)),
      cities: cityList
    };
  };

  // ================= LOAD AIRPORT =================
  const loadAirports = useCallback(async () => {
    try {
      await dispatch(
        listAllAirports({
          page: currentPage - 1,
          size: itemsPerPage,
          sortBy: sortField,
          sortDirection,
          keyword: searchQuery,
          country: filters.country,
          cityId: filters.cityId
        })
      ).unwrap();
    } catch (err) {
      showNotification('error', err || 'Failed to load airports');
    }
  }, [
    dispatch,
    currentPage,
    itemsPerPage,
    sortField,
    sortDirection,
    searchQuery,
    filters,
    showNotification
  ]);

  // Load cities for dropdown
  const loadCities = useCallback(async () => {
    try {
      await dispatch(getAllCities({ page: 0, size: 1000, sortBy: 'name', sortDirection: 'asc' })).unwrap();
    } catch (err) {
      console.error('Error loading cities:', err);
    }
  }, [dispatch]);

  // Event handlers

  const handleDeleteAirport = async (airportId) => {
    try {
      const airport = airports.find(a => a.id === airportId);
      await dispatch(deleteAirport(airportId)).unwrap();
      closeModals();
      showNotification('success', `Airport "${airport?.name}" deleted successfully`);
      await loadAirports();
    } catch (error) {
      console.error('Error deleting airport:', error);
      showNotification('error', error.message || 'Failed to delete airport');
    }
  };



  // UI handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const openAddModal = () => {
    navigate('/super-admin/airports/new');
  };

  const openEditModal = (airport) => {
    navigate(`/super-admin/airports/${airport.id}/edit`);
  };

  const openDeleteModal = (airport) => {
    setDeletingAirport(airport);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowDeleteModal(false);
    setDeletingAirport(null);
  };

  const resetFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExport = () => {
    showNotification('info', 'Export functionality will be available soon');
  };

  const handleImport = () => {
    showNotification('info', 'Import functionality will be available soon');
  };

  // Load airports whenever server-side query params change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAirports();
  }, [loadAirports]);

  // Load cities once for the filter dropdown
  useEffect(() => {
    loadCities();
  }, [loadCities]);

  if (error && airports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading airports</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</div>
          <Button onClick={loadAirports}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      <AirportNotification
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div />

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            className="hidden sm:inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>

          <Button
            onClick={handleImport}
            variant="outline"
            className="hidden sm:inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>

          <Button
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Airport
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <AirportStatsCards statistics={getStatistics()} />

      {/* Search & Filter Toolbar */}
      <AirportToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onExport={handleExport}
        onImport={handleImport}
        lastUpdated={new Date().toLocaleTimeString()}
      />

      {/* Advanced Filters */}
      <AirportFilters
        isVisible={showFilters}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={resetFilters}
        countries={getFilterOptions().countries}
        cities={getFilterOptions().cities}
      />

      {/* Airport Table */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-0">
          <AirportTable
            airports={airports || []}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            loading={loading}
          />

          {/* Pagination */}
          <div className="px-6">
            <AirportPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <AirportDeleteModal
        isOpen={showDeleteModal}
        onClose={closeModals}
        onConfirm={handleDeleteAirport}
        airport={deletingAirport}
        isLoading={loading}
      />
    </div>
  );
};

export default AirportManagementNew;
