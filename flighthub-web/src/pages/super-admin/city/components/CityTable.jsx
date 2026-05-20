import React from 'react';
import {
  Edit,
  Trash2,
  MoreVertical,
  MapPin,
  Globe,
  Clock,
  RefreshCw
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
    <div className="overflow-x-auto">
      <Table className="w-full text-sm">
        {/* ================= HEADER ================= */}
        <TableHeader className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <TableRow>
            <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              #
            </TableHead>

            <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              City
            </TableHead>

            <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Country
            </TableHead>

            <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Region
            </TableHead>

            <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Timezone
            </TableHead>

            <TableHead className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        {/* ================= BODY ================= */}
        <TableBody className="divide-y dark:divide-gray-700">
          {cities.map((city, idx) => (
            <TableRow
              key={city.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {/* INDEX */}
              <TableCell className="px-4 py-3 text-xs text-gray-400">
                {idx + 1}
              </TableCell>

              {/* CITY */}
              <TableCell className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold text-xs">
                    {(city.name || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {city.name}
                    </p>

                    <p className="text-xs text-gray-400">
                      {city.cityCode}
                    </p>
                  </div>
                </div>
              </TableCell>

              {/* COUNTRY */}
              <TableCell className="px-4 py-3">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                  {city.countryName}

                  <Badge className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {city.countryCode}
                  </Badge>
                </div>
              </TableCell>

              {/* REGION */}
              <TableCell className="px-4 py-3">
                {city.regionCode ? (
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {city.regionCode}
                  </Badge>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>

              {/* TIMEZONE */}
             <TableCell className="px-4 py-3">
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <Clock className="h-3.5 w-3.5 text-gray-400" />

                {city.timeZone
                  ? `(UTC${city.timeZoneOffset}) ${city.timeZone.split('/')[1].replace('_', ' ')}`
                  : '—'}
              </div>
            </TableCell>

              {/* ACTION */}
              <TableCell className="px-4 py-3 text-right">
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CityTable;