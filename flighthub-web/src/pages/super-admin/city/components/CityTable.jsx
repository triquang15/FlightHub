import React from 'react';
import {
  Edit,
  Trash2,
  MoreVertical,
  MapPin,
  Globe,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const getCityReadiness = (city) => {
  const blockers = [];

  if (!city?.name) blockers.push('Missing name');
  if (!city?.cityCode) blockers.push('Missing code');
  if (!city?.countryCode || !city?.countryName) blockers.push('Missing country');
  if (!city?.timeZone) blockers.push('Missing timezone');

  return {
    ready: blockers.length === 0,
    blockers,
  };
};

const formatTimezone = (city) => {
  if (!city?.timeZone) return '—';
  const timezoneName = city.timeZone.includes('/')
    ? city.timeZone.split('/').slice(1).join('/').replaceAll('_', ' ')
    : city.timeZone;
  return city.timeZoneOffset ? `(UTC${city.timeZoneOffset}) ${timezoneName}` : timezoneName;
};

const CityTable = ({
  cities = [],
  onEdit,
  onDelete,
  loading = false
}) => {

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <RefreshCw className="h-8 w-8 animate-spin mb-3 text-indigo-400" />
        <p className="text-sm">Loading cities...</p>
      </div>
    );
  }

  // ================= EMPTY =================
  if (!cities || cities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <MapPin className="h-10 w-10 mb-3 opacity-40" />
        <p className="font-medium">No cities found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain [scrollbar-color:theme(colors.gray.300)_transparent] [scrollbar-width:thin] dark:[scrollbar-color:theme(colors.gray.700)_transparent]">
      <Table className="w-[1340px] min-w-[1340px] table-fixed text-sm">
        {/* ================= HEADER ================= */}
        <TableHeader className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <TableRow>
            <TableHead className="w-16 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              #
            </TableHead>

            <TableHead className="w-80 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              City
            </TableHead>

            <TableHead className="w-72 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Country
            </TableHead>

            <TableHead className="w-36 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Region
            </TableHead>

            <TableHead className="w-72 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Timezone
            </TableHead>

            <TableHead className="w-44 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Search Ready
            </TableHead>

            <TableHead className="sticky right-0 z-10 w-24 bg-gray-50 px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        {/* ================= BODY ================= */}
        <TableBody className="divide-y dark:divide-gray-700">
          {cities.map((city, idx) => {
            const readiness = getCityReadiness(city);

            return (
              <TableRow
                key={city.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
              {/* INDEX */}
              <TableCell className="w-16 px-4 py-3 text-xs text-gray-400">
                {idx + 1}
              </TableCell>

              {/* CITY */}
              <TableCell className="w-80 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {/* Avatar */}
                  <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold text-xs">
                    {(city.name || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                      {city.name}
                    </p>

                    <p className="text-xs text-gray-400">
                      {city.cityCode}
                    </p>
                  </div>
                </div>
              </TableCell>

              {/* COUNTRY */}
              <TableCell className="w-72 px-4 py-3">
                <div className="flex min-w-0 items-center gap-1 text-gray-600 dark:text-gray-300">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">{city.countryName}</span>

                  <Badge className="ml-2 shrink-0 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {city.countryCode}
                  </Badge>
                </div>
              </TableCell>

              {/* REGION */}
              <TableCell className="w-36 px-4 py-3">
                {city.regionCode ? (
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {city.regionCode}
                  </Badge>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>

              {/* TIMEZONE */}
             <TableCell className="w-72 px-4 py-3">
              <div className="flex min-w-0 items-center gap-1 text-gray-500 text-xs">
                <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />

                <span className="truncate">
                {formatTimezone(city)}
                </span>
              </div>
            </TableCell>

              <TableCell className="w-44 px-4 py-3">
                <Badge
                  variant="outline"
                  className={
                    readiness.ready
                      ? 'gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'gap-1 border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300'
                  }
                >
                  {readiness.ready ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {readiness.ready ? 'Ready' : 'Review'}
                </Badge>
                <p className="mt-1 truncate text-xs text-gray-400">
                  {readiness.ready ? 'Airport mapping ready' : readiness.blockers.join(', ')}
                </p>
              </TableCell>

              {/* ACTION */}
              <TableCell className="sticky right-0 z-10 w-24 bg-white px-4 py-3 text-right shadow-[-10px_0_12px_-12px_rgba(15,23,42,0.45)] dark:bg-gray-900">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(city)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onDelete(city)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>

            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default CityTable;
