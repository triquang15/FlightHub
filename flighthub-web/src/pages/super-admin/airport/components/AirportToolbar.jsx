import {
  FileSpreadsheet,
  FileText,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AirportToolbar = ({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  onExport,
  onImport,
  lastUpdated
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      {/* LEFT */}
      <div className="flex flex-1 gap-3 items-center">
        {/* SEARCH */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search airport name or IATA code..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* FILTER */}
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={onToggleFilters}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        {/* EXPORT */}
        <Button
          variant="outline"
          onClick={onExport}
          className="flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Excel
        </Button>

        {/* IMPORT */}
        <Button
          variant="outline"
          onClick={onImport}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4 text-red-500" />
          PDF
        </Button>

        {/* LAST UPDATED */}
        {lastUpdated && (
          <span className="text-xs text-gray-400 ml-2">
            Updated {lastUpdated}
          </span>
        )}
      </div>
    </div>
  );
};

export default AirportToolbar;
