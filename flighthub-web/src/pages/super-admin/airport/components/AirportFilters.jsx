import { Globe, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const AirportFilters = ({
  isVisible,
  filters,
  onFiltersChange,
  onReset,
  countries = [],
  cities = []
}) => {
  if (!isVisible) return null;

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? '' : value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value);
  const cityNameById = cities.reduce((acc, city) => {
    acc[String(city.id)] = city.name;
    return acc;
  }, {});
  const countryNameByCode = countries.reduce((acc, country) => {
    acc[country.code] = `${country.name} (${country.code})`;
    return acc;
  }, {});
  const activeFilters = Object.entries(filters).filter(([, value]) => value);
  const getFilterLabel = (key, value) => {
    if (key === 'country') return `country: ${countryNameByCode[value] || value}`;
    if (key === 'cityId') return `city: ${cityNameById[value] || value}`;
    return `${key}: ${value}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          {/* Country Filter */}
          <Select
            value={filters.country || 'all'}
            onValueChange={(value) => handleFilterChange('country', value)}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="All Countries" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City Filter */}
          <Select
            value={filters.cityId || 'all'}
            onValueChange={(value) => handleFilterChange('cityId', value)}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="All Cities" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={String(city.id)}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset Filters
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(([key, value]) => (
            <Badge
              key={key}
              className="flex items-center gap-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
            >
              {getFilterLabel(key, value)}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleFilterChange(key, 'all')}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default AirportFilters;
