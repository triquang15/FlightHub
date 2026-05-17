import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const CityPagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 5,
  onPageChange,
  onItemsPerPageChange
}) => {

  const page = Number(currentPage) || 1;
  const size = Number(itemsPerPage) || 5;
  const total = Number(totalItems) || 0;
  const pages = Number(totalPages) || 1;

  // ✅ FIX: tránh NaN + đúng index
  const startItem = total === 0 ? 0 : (page - 1) * size + 1;
  const endItem = Math.min(page * size, total);

  // ================= PAGE NUMBERS =================
  const getPageNumbers = () => {
    const result = [];
    const max = 5;

    let start = Math.max(1, page - Math.floor(max / 2));
    let end = Math.min(pages, start + max - 1);

    if (end - start + 1 < max) {
      start = Math.max(1, end - max + 1);
    }

    for (let i = start; i <= end; i++) {
      result.push(i);
    }

    return result;
  };

  // ❗ chỉ ẩn khi total = 0
  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">

      {/* LEFT */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          Showing {startItem} to {endItem} of {total} cities
        </span>

        <div className="flex items-center gap-2">
          <span>Rows:</span>

          <Select
            value={String(size)}
            onValueChange={(value) => {
              onItemsPerPageChange(Number(value));
              onPageChange(1); // 🔥 reset page
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">

        {/* FIRST */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* PREVIOUS */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* NUMBERS */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p) => (
            <Button
              key={p}
              variant={page === p ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(p)}
              className="w-9"
            >
              {p}
            </Button>
          ))}
        </div>

        {/* NEXT */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* LAST */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pages)}
          disabled={page >= pages}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>

      </div>
    </div>
  );
};

export default CityPagination;