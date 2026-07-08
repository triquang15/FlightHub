import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const airportCode = (airport) => airport?.iataCode || airport?.icaoCode || airport?.code || `#${airport?.id || "N/A"}`;

const airportCity = (airport) =>
  airport?.city?.name || airport?.cityName || airport?.address?.cityName || airport?.address?.city || "Unknown city";

const airportLabel = (airport) => {
  if (!airport) return "Unknown airport";
  return [airportCode(airport), airport.name, airportCity(airport)]
    .filter(Boolean)
    .join(" ");
};

const AirportValue = ({ airport, placeholder, allLabel }) => {
  if (allLabel) {
    return <span className="truncate text-muted-foreground">{allLabel}</span>;
  }

  if (!airport) {
    return <span className="truncate text-muted-foreground">{placeholder}</span>;
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
        {airportCode(airport)}
      </span>
      <span className="min-w-0 truncate text-left">{airport.name || "Airport"}</span>
    </span>
  );
};

const AirportOption = ({ airport }) => (
  <div className="flex min-w-0 flex-col gap-0.5 py-1">
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
        {airportCode(airport)}
      </span>
      <span className="truncate text-sm font-medium">{airportCity(airport)}</span>
    </div>
    <span className="truncate text-xs text-muted-foreground">{airport.name || "Airport"}</span>
  </div>
);

const AirportSelect = ({
  airports = [],
  value,
  onValueChange,
  placeholder = "Select airport",
  disabled = false,
  excludeAirportId,
  includeAll = false,
  allValue = "all",
  allLabel = "All airports",
  triggerClassName,
  contentClassName,
  invalid = false,
}) => {
  const selectedAirport = airports.find((airport) => String(airport.id) === String(value));
  const selectedAll = includeAll && value === allValue;
  const visibleAirports = airports.filter((airport) => String(airport.id) !== String(excludeAirportId || ""));

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn("h-11 w-full min-w-0", triggerClassName)}
        aria-invalid={invalid}
      >
        <SelectValue placeholder={placeholder}>
          <AirportValue
            airport={selectedAirport}
            placeholder={placeholder}
            allLabel={selectedAll ? allLabel : ""}
          />
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className={cn("w-[min(520px,calc(100vw-2rem))]", contentClassName)}
        position="popper"
        align="start"
      >
        {includeAll && (
          <SelectItem value={allValue} className="h-auto py-2">
            <span className="text-sm font-medium">{allLabel}</span>
          </SelectItem>
        )}
        {visibleAirports.map((airport) => (
          <SelectItem
            key={airport.id}
            value={String(airport.id)}
            textValue={airportLabel(airport)}
            className="h-auto py-2"
          >
            <AirportOption airport={airport} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AirportSelect;
