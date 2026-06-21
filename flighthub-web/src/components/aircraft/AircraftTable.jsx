import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listAllAircrafts } from '@/Redux/aircraft/aircraftThunks';
import { setSearchKeyword, setStatusFilter, setCurrentPage, setPageSize, setSortBy, setSortDirection } from '@/Redux/aircraft/aircraftSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Search, Filter, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Plane, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Loader } from '@/components/common/Loader';
import { EmptyState } from '@/components/common/EmptyState';

const AircraftTable = ({ onViewDetails, onEdit, onDelete }) => {
  const dispatch = useDispatch();
  const {
    aircrafts,
    paginatedAircrafts,
    loading,
    error,
    searchKeyword,
    statusFilter,
    currentPage,
    pageSize,
    sortBy,
    sortDirection,
    deleteLoading,
  } = useSelector(state => state.aircraft);

  const [localSearchTerm, setLocalSearchTerm] = useState(searchKeyword);
  const visibleAircrafts = Array.isArray(aircrafts)
    ? aircrafts
    : (Array.isArray(paginatedAircrafts?.content) ? paginatedAircrafts.content : []);
  const totalAircrafts = paginatedAircrafts?.totalElements ?? visibleAircrafts.length;
  const rangeStart = totalAircrafts === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = Math.min((currentPage + 1) * pageSize, totalAircrafts);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(setSearchKeyword(localSearchTerm));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchTerm, dispatch]);

  useEffect(() => {
    dispatch(listAllAircrafts({
      page: currentPage,
      size: pageSize,
      search: searchKeyword,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sortBy,
      sortDirection
    }));
  }, [dispatch, currentPage, pageSize, searchKeyword, statusFilter, sortBy, sortDirection]);

  const handleSort = (field) => {
    if (sortBy === field) {
      dispatch(setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      dispatch(setSortBy(field));
      dispatch(setSortDirection('asc'));
    }
  };

  const handlePageChange = (newPage) => {
    dispatch(setCurrentPage(newPage));
  };

  const handlePageSizeChange = (newSize) => {
    dispatch(setPageSize(parseInt(newSize)));
    dispatch(setCurrentPage(0));
  };

  const handleStatusFilterChange = (status) => {
    dispatch(setStatusFilter(status));
    dispatch(setCurrentPage(0));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'maintenance':
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300';
      case 'inactive':
        return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300';
      case 'retired':
        return 'border-border bg-muted text-muted-foreground';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300';
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/70" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-foreground" />
      : <ArrowDown className="h-3.5 w-3.5 text-foreground" />;
  };

  const renderActions = (aircraft) => (
    <TooltipProvider delayDuration={120}>
      <div className="flex justify-center space-x-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="View aircraft"
              onClick={() => onViewDetails(aircraft)}
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit aircraft"
              onClick={() => onEdit(aircraft)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete aircraft"
                  disabled={deleteLoading}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete aircraft?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove {aircraft.code || 'this aircraft'} from the fleet.
                Aircraft already referenced by schedules or operations may be blocked by the server.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(aircraft)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );

  if (loading && !visibleAircrafts.length) {
    return <Loader message="Loading aircraft data..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>Error loading aircraft data: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Aircraft Fleet
            </CardTitle>
            <Badge variant="outline">
              {totalAircrafts} total aircraft
            </Badge>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, model, or manufacturer..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {visibleAircrafts.length === 0 ? (
          <EmptyState
            icon={Plane}
            title="No Aircraft Found"
            description={
              searchKeyword || statusFilter !== 'all'
                ? "No aircraft match your current search criteria"
                : "No aircraft have been added to your fleet yet"
            }
          />
        ) : (
          <>
            {/* Table */}
            <div className="overflow-hidden rounded-md border bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead
                      className="cursor-pointer select-none transition-colors hover:bg-muted"
                      onClick={() => handleSort('code')}
                    >
                      <span className="flex items-center gap-1.5">Code {getSortIcon('code')}</span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none transition-colors hover:bg-muted"
                      onClick={() => handleSort('model')}
                    >
                      <span className="flex items-center gap-1.5">Model {getSortIcon('model')}</span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none transition-colors hover:bg-muted"
                      onClick={() => handleSort('manufacturer')}
                    >
                      <span className="flex items-center gap-1.5">Manufacturer {getSortIcon('manufacturer')}</span>
                    </TableHead>
                    <TableHead className="text-center">Total Seats</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleAircrafts.map((aircraft) => (
                    <TableRow key={aircraft.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{aircraft.code}</TableCell>
                      <TableCell>{aircraft.model}</TableCell>
                      <TableCell>{aircraft.manufacturer}</TableCell>
                      <TableCell className="text-center">
                        {aircraft.seatingCapacity || aircraft.totalSeats || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getStatusColor(aircraft.status)}>
                          {aircraft.status || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{renderActions(aircraft)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {rangeStart} - {rangeEnd} of {totalAircrafts}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={paginatedAircrafts.first || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={paginatedAircrafts.last || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AircraftTable;
