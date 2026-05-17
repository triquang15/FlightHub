/**
 * City Management Helper Functions
 * Production-ready version (optimized + bug fixed + export upgraded)
 */

// ================= FILTER =================
export const filterCities = (cities, searchQuery, filters = {}) => {
  const hasFilters = Object.values(filters).some(Boolean);
  if (!searchQuery && !hasFilters) return cities;

  return cities.filter((city) => {

    // ===== SEARCH =====
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();

      const matchesSearch = [
        city.name,
        city.cityCode,
        city.countryName,
        city.countryCode,
        city.regionCode
      ].some((field) =>
        field?.toLowerCase().includes(searchLower)
      );

      if (!matchesSearch) return false;
    }

    // ===== FILTER =====
    if (filters.country && city.countryCode !== filters.country) return false;

    if (filters.timezone && city.timeZoneOffset !== filters.timezone) return false;

    if (filters.region && city.regionCode !== filters.region) return false;

    return true;
  });
};

// ================= SORT =================
export const sortCities = (cities, sortField, sortDirection) => {
  return [...cities].sort((a, b) => {
    const aVal = a[sortField] ?? '';
    const bVal = b[sortField] ?? '';

    const result = String(aVal).localeCompare(String(bVal));

    return sortDirection === 'asc' ? result : -result;
  });
};

// ================= PAGINATION =================
export const paginateCities = (cities, currentPage, itemsPerPage) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return {
    paginatedCities: cities.slice(startIndex, endIndex),
    totalPages: Math.ceil(cities.length / itemsPerPage),
    totalItems: cities.length
  };
};

// ================= UNIQUE DATA =================
export const getUniqueCountries = (cities) => {
  const map = new Map();

  cities.forEach((city) => {
    if (city.countryCode) {
      map.set(city.countryCode, {
        name: city.countryName,
        code: city.countryCode
      });
    }
  });

  return Array.from(map.values());
};

export const getUniqueTimezones = (cities) => {
  return [...new Set(cities.map((c) => c.timeZoneOffset))].filter(Boolean);
};

export const getUniqueRegions = (cities) => {
  return [...new Set(cities.map((c) => c.regionCode))].filter(Boolean);
};

// ================= FORMAT =================
export const formatTimezone = (timezone) => {
  if (!timezone) return '';
  return timezone.replace('UTC', 'UTC ');
};

// ================= CSV EXPORT =================
export const exportCitiesToCSV = (cities) => {
  const headers = [
    'ID',
    'Name',
    'City Code',
    'Country Name',
    'Country Code',
    'Region Code',
    'Timezone Offset'
  ];

  const csvContent = [
    headers.join(','),
    ...cities.map((city) => [
      city.id,
      `"${city.name}"`,
      city.cityCode,
      `"${city.countryName}"`,
      city.countryCode,
      city.regionCode || '',
      city.timeZoneOffset || ''
    ].join(','))
  ].join('\n');

  return csvContent;
};

// ================= DOWNLOAD CSV =================
export const downloadCSV = (csvContent, filename = 'cities.csv') => {
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ================= EXCEL EXPORT =================
export const exportCitiesToExcel = async (cities) => {
  const XLSX = await import('xlsx');
  const { saveAs } = await import('file-saver');

  const data = cities.map((city) => ({
    ID: city.id,
    Name: city.name,
    CityCode: city.cityCode,
    Country: city.countryName,
    CountryCode: city.countryCode,
    Region: city.regionCode || '',
    Timezone: city.timeZoneOffset || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cities');

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  saveAs(blob, 'cities.xlsx');
};

// ================= PDF EXPORT =================
export const exportCitiesToPDF = async (cities) => {
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();

  const tableData = cities.map((city) => [
    city.id,
    city.name,
    city.cityCode,
    city.countryName,
    city.countryCode,
    city.regionCode || '',
    city.timeZoneOffset || ''
  ]);

  autoTable(doc, {
    head: [['ID', 'Name', 'Code', 'Country', 'CC', 'Region', 'Timezone']],
    body: tableData
  });

  doc.save('cities.pdf');
};