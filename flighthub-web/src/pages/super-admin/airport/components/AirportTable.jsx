import {
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  AlertTriangle,
  CheckCircle,
  MapPin,
  MoreVertical,
  Plane,
  RefreshCw,
  Trash2
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

const getAirportReadiness = (airport) => {
  const blockers = [];

  if (!airport?.iataCode) blockers.push('Missing IATA');
  if (!airport?.name) blockers.push('Missing name');
  if (!airport?.city?.id) blockers.push('Missing city');
  if (!airport?.timeZone) blockers.push('Missing timezone');
  if (!airport?.geoCode?.latitude || !airport?.geoCode?.longitude) blockers.push('Missing coordinates');

  return {
    ready: blockers.length === 0,
    blockers,
  };
};

const SortableHeader = ({ field, sortField, sortDirection, onSort, children, className = "" }) => (
  <TableHead
    className={`px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      {children}
      {sortField === field && (
        sortDirection === 'asc' ?
          <ChevronUp className="w-4 h-4" /> :
          <ChevronDown className="w-4 h-4" />
      )}
    </div>
  </TableHead>
);

const AirportTable = ({
  airports,
  
  sortField,
  sortDirection,
  onSort,

  onEdit,
  onDelete,
  loading = false
}) => {

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <RefreshCw className="h-8 w-8 animate-spin mb-3 text-indigo-400" />
        <p className="text-sm">Loading airports...</p>
      </div>
    );
  }

  if (!airports || airports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <Plane className="h-10 w-10 mb-3 opacity-40" />
        <p className="font-medium">No airports found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain [scrollbar-color:theme(colors.gray.300)_transparent] [scrollbar-width:thin] dark:[scrollbar-color:theme(colors.gray.700)_transparent]">
      <Table className="w-[1560px] min-w-[1560px] table-fixed text-sm">
        <TableHeader className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <TableRow>
            
            <SortableHeader
              field="iataCode"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
              className="w-32"
            >
              IATA Code
            </SortableHeader>
            <SortableHeader
              field="name"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
              className="w-72"
            >
              Airport Name
            </SortableHeader>
            <TableHead className="w-80 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Detailed Name
            </TableHead>
            <SortableHeader
              field="city"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
              className="w-52"
            >
              City
            </SortableHeader>
            <TableHead className="w-48 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Timezone
            </TableHead>
            <TableHead className="w-40 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Coordinates
            </TableHead>
            <TableHead className="w-44 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Search Ready
            </TableHead>
            <TableHead className="sticky right-0 z-10 w-24 bg-gray-50 px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y dark:divide-gray-700">
          {airports.map((airport) => {
            const readiness = getAirportReadiness(airport);

            return (
              <TableRow
                key={airport.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
             
              <TableCell className="w-32 px-4 py-3">
                <Badge className="font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {airport.iataCode}
                </Badge>
              </TableCell>
              <TableCell className="w-72 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold text-xs">
                    {(airport.iataCode || airport.name || '?')[0].toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                      {airport.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {airport.iataCode}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="w-80 px-4 py-3 text-gray-600 dark:text-gray-300">
                <span className="block truncate">
                  {airport.detailedName || <span className="text-gray-400">—</span>}
                </span>
              </TableCell>
              <TableCell className="w-52 px-4 py-3">
                <div className="flex min-w-0 items-center gap-1 text-gray-600 dark:text-gray-300">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">{airport.city?.name || '—'}</span>
                </div>
              </TableCell>
              <TableCell className="w-48 px-4 py-3">
                <div className="flex min-w-0 items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">
                    {airport.timeZone || '—'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="w-40 px-4 py-3">
                {airport.geoCode?.latitude && airport.geoCode?.longitude ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <div>{airport.geoCode.latitude.toFixed(4)}</div>
                    <div>{airport.geoCode.longitude.toFixed(4)}</div>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
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
                  {readiness.ready ? 'Search enabled' : readiness.blockers.join(', ')}
                </p>
              </TableCell>
              <TableCell className="sticky right-0 z-10 w-24 bg-white px-4 py-3 text-right shadow-[-10px_0_12px_-12px_rgba(15,23,42,0.45)] dark:bg-gray-900">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(airport)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(airport)}
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

export default AirportTable;
