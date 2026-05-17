import React from 'react';
import { Globe, Clock, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const CityFilters = ({
  isVisible,
  filters,
  onFiltersChange,
  onReset,
  countries = [],
  timezones = [],
  regions = []
}) => {
  if (!isVisible) return null;

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? '' : value
    });
  };

  const activeFilters = Object.entries(filters).filter(([_, v]) => v);

  return (
    <div className="space-y-4">

      {/* 🔥 FILTER BAR */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">

        {/* LEFT */}
        <div className="flex flex-wrap gap-3">

          {/* COUNTRY */}
          <Select
            value={filters.country || 'all'}
            onValueChange={(value) => handleFilterChange('country', value)}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="Country" />
              </div>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* TIMEZONE */}
          <Select
            value={filters.timezone || 'all'}
            onValueChange={(value) => handleFilterChange('timezone', value)}
          >
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="Timezone" />
              </div>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Timezones</SelectItem>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* REGION */}
          <Select
            value={filters.region || 'all'}
            onValueChange={(value) => handleFilterChange('region', value)}
          >
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="Region" />
              </div>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Reset Filters
            </Button>
          )}
        </div>

      </div>

      {/* 🔥 ACTIVE FILTER BADGES */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">

          {activeFilters.map(([key, value]) => (
            <Badge
              key={key}
              className="flex items-center gap-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
            >
              {key}: {value}
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

export default CityFilters;