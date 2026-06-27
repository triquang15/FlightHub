import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock3,
  DollarSign,
  Filter,
  Plane,
  RotateCcw,
  Timer,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  MAX_DURATION,
  PRICE_LIMITS,
  createDefaultFlightFilters,
} from "./flightFilterConfig";

const TIME_RANGES = [
  { value: "any", label: "Any time", detail: "All day" },
  { value: "morning", label: "Morning", detail: "06:00 - 11:59" },
  { value: "afternoon", label: "Afternoon", detail: "12:00 - 17:59" },
  { value: "evening", label: "Evening", detail: "18:00 - 20:59" },
  { value: "night", label: "Night", detail: "21:00 - 05:59" },
];

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  return hours >= 24 ? "Any duration" : `Up to ${hours}h`;
};

const FilterSection = ({ id, title, icon: Icon, expanded, onToggle, children }) => (
  <section className="border-t border-border/70 first:border-t-0">
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="flex h-12 w-full items-center justify-between px-4 text-left"
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </span>
      {expanded ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
    {expanded && <div className="px-4 pb-4">{children}</div>}
  </section>
);

const TimeOptions = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    {TIME_RANGES.map((range) => (
      <button
        key={range.value}
        type="button"
        onClick={() => onChange(range.value)}
        className={cn(
          "min-h-14 rounded-md border px-3 py-2 text-left transition-colors",
          value === range.value
            ? "border-primary bg-primary/10 text-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-muted/50",
        )}
      >
        <span className="block text-xs font-medium">{range.label}</span>
        <span className="mt-0.5 block text-[11px]">{range.detail}</span>
      </button>
    ))}
  </div>
);

const FiltersSidebar = ({ filters, onFiltersChange, airlines = [], className }) => {
  const [expanded, setExpanded] = React.useState({
    price: true,
    airlines: true,
    departure: true,
    arrival: false,
    duration: false,
  });

  const updateFilter = (key, value) => {
    onFiltersChange((current) => ({ ...current, [key]: value }));
  };

  const activeCount =
    filters.airlines.length +
    Number(
      filters.priceRange.min !== PRICE_LIMITS.min ||
        filters.priceRange.max !== PRICE_LIMITS.max,
    ) +
    Number(filters.departureTimeRange !== "any") +
    Number(filters.arrivalTimeRange !== "any") +
    Number(filters.maxDuration !== MAX_DURATION);

  const toggleAirline = (id) => {
    updateFilter(
      "airlines",
      filters.airlines.includes(id)
        ? filters.airlines.filter((airlineId) => airlineId !== id)
        : [...filters.airlines, id],
    );
  };

  const toggleSection = (id) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <aside className={cn("sticky top-24 overflow-hidden rounded-md border bg-card", className)}>
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Filter flights</h2>
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
              {activeCount}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange(createDefaultFlightFilters())}
          disabled={activeCount === 0}
          className="h-8 gap-1.5 px-2 text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      <FilterSection id="price" title="Price per traveler" icon={DollarSign} expanded={expanded.price} onToggle={toggleSection}>
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>{usd.format(filters.priceRange.min)}</span>
            <span>{usd.format(filters.priceRange.max)}</span>
          </div>
          <Slider
            value={[filters.priceRange.min, filters.priceRange.max]}
            onValueChange={([min, max]) => updateFilter("priceRange", { min, max })}
            min={PRICE_LIMITS.min}
            max={PRICE_LIMITS.max}
            step={25}
          />
          <p className="text-xs text-muted-foreground">Includes taxes and airline fees</p>
        </div>
      </FilterSection>

      <FilterSection id="airlines" title="Airlines" icon={Plane} expanded={expanded.airlines} onToggle={toggleSection}>
        {airlines.length > 0 ? (
          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {airlines.map((airline) => {
              const checked = filters.airlines.includes(airline.id);
              return (
                <label
                  key={airline.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggleAirline(airline.id)} />
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={airline.logoUrl || airline.logo} alt="" />
                    <AvatarFallback className="text-[10px]">
                      {airline.iataCode || airline.code || "--"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm">{airline.name}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Airlines will appear with available results.</p>
        )}
      </FilterSection>

      <FilterSection id="departure" title="Departure time" icon={Clock3} expanded={expanded.departure} onToggle={toggleSection}>
        <TimeOptions
          value={filters.departureTimeRange}
          onChange={(value) => updateFilter("departureTimeRange", value)}
        />
      </FilterSection>

      <FilterSection id="arrival" title="Arrival time" icon={Clock3} expanded={expanded.arrival} onToggle={toggleSection}>
        <TimeOptions
          value={filters.arrivalTimeRange}
          onChange={(value) => updateFilter("arrivalTimeRange", value)}
        />
      </FilterSection>

      <FilterSection id="duration" title="Journey duration" icon={Timer} expanded={expanded.duration} onToggle={toggleSection}>
        <div className="space-y-4 pt-1">
          <div className="text-sm font-medium">{formatDuration(filters.maxDuration)}</div>
          <Slider
            value={[filters.maxDuration]}
            onValueChange={([value]) => updateFilter("maxDuration", value)}
            min={60}
            max={MAX_DURATION}
            step={30}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1h</span>
            <span>24h+</span>
          </div>
        </div>
      </FilterSection>
    </aside>
  );
};

export default FiltersSidebar;
