import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Redux actions
import {
  createCity,
  updateCity,
  deleteCity,
  getAllCities
} from '@/Redux/city/cityThunk';

// Components
import CityStatsCards from './components/CityStatsCards';
import CityToolbar from './components/CityToolbar';
import CityFilters from './components/CityFilters';
import CityTable from './components/CityTable';
import CityPagination from './components/CityPagination';
import CityFormModal from './components/CityFormModal';
import CityDeleteModal from './components/CityDeleteModal';
import CityNotification from './components/CityNotification';

// Utils
import { exportCitiesToExcel, exportCitiesToPDF } from './utils/cityHelpers';

const parseError = (err) => {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message) return err.message;
  return "Something went wrong";
};

const CityManagement = () => {
  const dispatch = useDispatch();

  const { cityList, loading, error, total, totalPages } = useSelector((state) => state.city);
  const cities = cityList || [];

  // ================= STATE =================
  const [selectedCities, setSelectedCities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [showFilters, setShowFilters] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingCity, setEditingCity] = useState(null);
  const [deletingCity, setDeletingCity] = useState(null);

  const [notification, setNotification] = useState(null);


  // ================= NOTIFICATION =================
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ================= STATS =================
  const getStatistics = () => {
    if (!Array.isArray(cities)) {
      return { totalCities: 0, totalCountries: 0, totalTimezones: 0, issues: 0 };
    }

    return {
      totalCities: total || cities.length,
      totalCountries: new Set(cities.map(c => c.countryCode)).size,
      totalTimezones: new Set(cities.map(c => c.timeZoneOffset)).size,
      issues: 0
    };
  };

  // ================= FILTER OPTIONS =================
  const getFilterOptions = () => {
    if (!Array.isArray(cities)) {
      return { countries: [], timezones: [], regions: [] };
    }

    const countries = new Set();
    const timezones = new Set();
    const regions = new Set();

    cities.forEach(city => {
      if (city.countryName && city.countryCode) {
        countries.add(JSON.stringify({ name: city.countryName, code: city.countryCode }));
      }
      if (city.timeZoneOffset) timezones.add(city.timeZoneOffset);
      if (city.regionCode) regions.add(city.regionCode);
    });

    return {
      countries: Array.from(countries).map(c => JSON.parse(c)),
      timezones: Array.from(timezones),
      regions: Array.from(regions)
    };
  };

  // ================= LOAD DATA =================
  const loadCities = useCallback(async () => {
    try {
      const params = {
        page: currentPage - 1,
        size: itemsPerPage,
        sortBy: "name",
        sortDirection: "asc",

        keyword: searchQuery || undefined,
        country: filters.country || undefined,
        timezone: filters.timezone || undefined,
        region: filters.region || undefined,
      };

      const res = await dispatch(getAllCities(params)).unwrap();

    } catch (err) {
      console.error(err);
      showNotification('error', err || 'Failed to load cities');
    }
  }, [currentPage, itemsPerPage, searchQuery, filters]);

  // ================= CRUD =================
  const handleAddCity = async (cityData) => {
    try {
      await dispatch(createCity(cityData)).unwrap();

      setShowAddModal(false);

      showNotification('success', `City "${cityData.name}" created`);

      loadCities();

    } catch (err) {
      showNotification('error', parseError(err));
    }
  };

  const handleEditCity = async (cityData) => {
    try {
      await dispatch(
        updateCity({ id: editingCity.id, payload: cityData })
      ).unwrap();

      setShowEditModal(false);

      setEditingCity(null);

      showNotification('success', `Updated "${cityData.name}"`);

      loadCities();

    } catch (err) {
      showNotification('error', parseError(err));
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteCity(deletingCity.id)).unwrap();

      setShowDeleteModal(false);
      showNotification('success', 'Deleted successfully');

      loadCities();

    } catch (err) {
      showNotification('error', parseError(err));
    }
  };

  const checkCityCodeExists = async (cityCode, currentCityId = null) => {
    const found = cities.find(c => c.cityCode === cityCode);
    if (found && found.id !== currentCityId) {
      return { exists: true, error: 'City code already exists' };
    }
    return { exists: false };
  };

  // ================= EFFECT =================
  useEffect(() => {
    loadCities();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    const t = setTimeout(loadCities, 300);
    return () => clearTimeout(t);
  }, [searchQuery, filters]);

  // ================= ERROR UI =================
  if (error && (!cities || cities.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading cities</div>
          <div className="text-sm text-gray-500 mb-4">{error}</div>
          <Button onClick={loadCities}>Retry</Button>
        </div>
      </div>
    );
  }

  // ================= RENDER =================
  return (
    <div className="space-y-6">

      <CityNotification notification={notification} onClose={() => setNotification(null)} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        {/* LEFT */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
              <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </span>
            City Directory
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and organize global cities across your platform
          </p>
        </div>

        {/* RIGHT */}
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New City
        </Button>

      </div>
      <CityStatsCards statistics={getStatistics()} />

      <CityToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}

        onExportExcel={async () => {
          await exportCitiesToExcel(cities);
        }}

        onExportPDF={async () => {
          await exportCitiesToPDF(cities);
        }}

        lastUpdated={new Date().toLocaleTimeString()}
      />

      <CityFilters
        isVisible={showFilters}
        filters={filters}
        onFiltersChange={(f) => {
          setFilters(f);
          setCurrentPage(1);
        }}
        onReset={() => {
          setFilters({});
          setSearchQuery('');
        }}
        countries={getFilterOptions().countries}
        timezones={getFilterOptions().timezones}
        regions={getFilterOptions().regions}
      />

      <Card>
        <CardContent className="p-0">
          <CityTable
            cities={cities}
            selectedCities={selectedCities}
            onEdit={(c) => {
              setEditingCity(c);
              setShowEditModal(true);
            }}
            onDelete={(c) => {
              setDeletingCity(c);
              setShowDeleteModal(true);
            }}
            loading={loading}
          />

          <div className="px-6">
            <CityPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* MODALS */}
      <CityFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCity}
        isLoading={loading}
        checkCityCodeExists={checkCityCodeExists}
      />

      <CityFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditCity}
        city={editingCity}
        isLoading={loading}
        checkCityCodeExists={checkCityCodeExists}
      />

      <CityDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => handleDelete(deletingCity?.id)}
        city={deletingCity}
        isLoading={loading}
      />
    </div>
  );
};

export default CityManagement;