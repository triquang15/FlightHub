import { ArrowDown, ArrowUp, Clock3, Grid2X2, List, PlaneLanding, PlaneTakeoff, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "price", label: "Price", icon: Tag },
  { value: "duration", label: "Duration", icon: Clock3 },
  { value: "departure", label: "Departure", icon: PlaneTakeoff },
  { value: "arrival", label: "Arrival", icon: PlaneLanding },
];

const SortingBar = ({
  sortBy,
  sortOrder,
  onSortChange,
  onSortOrderChange,
  resultsCount,
  viewMode,
  onViewModeChange,
  className,
}) => {
  const selectSort = (value) => {
    if (value === sortBy) {
      onSortOrderChange(sortOrder === "asc" ? "desc" : "asc");
      return;
    }
    onSortChange(value);
    onSortOrderChange("asc");
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <p className="text-sm font-semibold">
          {resultsCount} available flight{resultsCount === 1 ? "" : "s"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">Fares shown in USD, including taxes</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <span className="mr-1 whitespace-nowrap text-xs text-muted-foreground">Sort by</span>
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = option.value === sortBy;
          return (
            <Button
              key={option.value}
              type="button"
              variant={active ? "secondary" : "ghost"}
              size="sm"
              onClick={() => selectSort(option.value)}
              title={`Sort by ${option.label.toLowerCase()}`}
              className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
              {active &&
                (sortOrder === "asc" ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                ))}
            </Button>
          );
        })}

        <div className="ml-1 flex shrink-0 rounded-md border p-0.5">
          <Button
            type="button"
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange("list")}
            title="List view"
            className="h-7 w-7"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange("grid")}
            title="Grid view"
            className="h-7 w-7"
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SortingBar;
