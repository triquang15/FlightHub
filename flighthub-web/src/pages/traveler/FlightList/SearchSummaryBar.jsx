import { ArrowRight, CalendarDays, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date(date))
    : "Select date";

const formatCabinClass = (value = "") =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const SearchSummaryBar = ({ searchData, onModifySearch, className }) => (
  <section className={cn("rounded-md border bg-card", className)}>
    <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 text-xl font-semibold">
              <span>{searchData.from}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span>{searchData.to}</span>
            </div>
            {(searchData.fromName || searchData.toName) && (
              <p className="mt-1 max-w-xl truncate text-xs text-muted-foreground">
                {searchData.fromName || searchData.from} to {searchData.toName || searchData.to}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2 md:justify-end">
        <span className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatDate(searchData.departureDate)}</span>
          {searchData.returnDate && (
            <span className="text-muted-foreground">to {formatDate(searchData.returnDate)}</span>
          )}
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {searchData.passengers} traveler{searchData.passengers === 1 ? "" : "s"}
          <span aria-hidden="true">·</span>
          {formatCabinClass(searchData.cabinClass)}
        </span>
        <Button variant="outline" size="sm" onClick={onModifySearch} className="gap-2">
          <Pencil className="h-3.5 w-3.5" />
          Change
        </Button>
      </div>
    </div>
  </section>
);

export default SearchSummaryBar;
