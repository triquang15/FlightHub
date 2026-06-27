import * as React from "react"
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronsUpDown,
  CircleDot,
  GitBranch,
  MapPin,
  Minus,
  Plane,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { listAllAirports } from "@/Redux/airport/airportThunk"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const tripTypes = [
  { id: "roundTrip", label: "Round trip", icon: ArrowLeftRight },
  { id: "oneWay", label: "One way", icon: Plane },
  { id: "multiCity", label: "Multi-city", icon: GitBranch },
]

const cabinClasses = [
  { value: "ECONOMY", label: "Economy", description: "Best value for everyday travel" },
  { value: "PREMIUM_ECONOMY", label: "Premium economy", description: "Extra space and added comfort" },
  { value: "BUSINESS", label: "Business", description: "Priority service and premium seating" },
  { value: "FIRST", label: "First class", description: "Our most exclusive travel experience" },
]

const travelerFares = [
  { id: "regular", label: "Regular" },
  { id: "student", label: "Student" },
  { id: "senior_citizen", label: "Senior" },
  { id: "armed_forces", label: "Armed forces" },
]

const today = new Date()
today.setHours(0, 0, 0, 0)

const createSegment = (overrides = {}) => ({
  id: crypto.randomUUID(),
  departureAirportId: "",
  arrivalAirportId: "",
  departureDate: null,
  ...overrides,
})

const formatDate = (date) => {
  if (!date) return "Select date"
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)
}

const formatApiDate = (date) => {
  if (!date) return ""
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().split("T")[0]
}

const getAirportCity = (airport) =>
  airport?.city?.name || airport?.cityName || airport?.address?.cityName || airport?.address?.city || "Unknown city"

const getAirportLabel = (airport) =>
  [airport?.iataCode, airport?.name].filter(Boolean).join(" · ") || "Airport"

const getAirportSearchValue = (airport) =>
  [airport?.iataCode, airport?.name, getAirportCity(airport), airport?.detailedName]
    .filter(Boolean)
    .join(" ")

const FieldShell = ({ icon: Icon, label, children, className }) => (
  <div className={cn(
    "min-w-0 rounded-xl border border-border/80 bg-background px-4 py-3 transition duration-200 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10",
    className,
  )}>
    <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {label}
    </div>
    {children}
  </div>
)

const AirportSelect = ({
  airports,
  excludedAirportId,
  value,
  onChange,
  placeholder,
  loading,
  error,
  onRetry,
}) => {
  const [open, setOpen] = React.useState(false)
  const selectedAirport = airports.find((airport) => airport.id === Number(value))
  const availableAirports = airports.filter((airport) => airport.id !== Number(excludedAirportId))
  const disabled = loading || (!error && availableAirports.length === 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex w-full min-w-0 items-center justify-between gap-3 rounded-md text-left outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="min-w-0">
            <span className={cn("block truncate text-base font-semibold", !selectedAirport && "text-muted-foreground")}>
              {selectedAirport ? getAirportCity(selectedAirport) : placeholder}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {loading
                ? "Loading airports..."
                : selectedAirport
                  ? getAirportLabel(selectedAirport)
                  : error || "City or airport"}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[calc(100vw-2rem)] p-0 sm:w-[420px]">
        {loading && (
          <div className="px-4 py-5 text-sm text-muted-foreground">Loading airports...</div>
        )}
        {!loading && error && (
          <div className="space-y-3 px-4 py-5 text-sm">
            <p className="text-destructive">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}
        {!loading && !error && (
          <Command filter={(value, search) => {
            if (!search) return 1
            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }}>
            <CommandInput placeholder="Search city, airport, or IATA code..." />
            <CommandList>
              <CommandEmpty>No airports found.</CommandEmpty>
              <CommandGroup>
                {availableAirports.map((airport) => (
                  <CommandItem
                    key={airport.id}
                    value={getAirportSearchValue(airport)}
                    onSelect={() => {
                      onChange(airport.id)
                      setOpen(false)
                    }}
                    className="cursor-pointer py-3"
                  >
                    <span className="rounded-lg bg-primary/10 px-2.5 py-2 text-xs font-bold text-primary">
                      {airport.iataCode || "--"}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{getAirportCity(airport)}</span>
                      <span className="block truncate text-xs text-muted-foreground">{airport.name}</span>
                    </span>
                    <Check className={cn(
                      "ml-auto h-4 w-4",
                      selectedAirport?.id === airport.id ? "opacity-100" : "opacity-0",
                    )} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}

const DateField = ({ date, label, minimumDate = today, onChange, helper = "Travel date" }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="min-w-0 text-left">
          <FieldShell icon={CalendarDays} label={label} className="h-full">
            <p className={cn("truncate text-base font-semibold", !date && "text-muted-foreground")}>{formatDate(date)}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{helper}</p>
          </FieldShell>
        </button>
      </DialogTrigger>
      <DialogContent className="w-auto max-w-[calc(100vw-2rem)] p-0">
        <DialogHeader className="px-6 pt-6"><DialogTitle>Select {label.toLowerCase()}</DialogTitle></DialogHeader>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onChange(selectedDate)
            setOpen(false)
          }}
          disabled={{ before: minimumDate }}
          className="p-4 sm:p-6"
        />
      </DialogContent>
    </Dialog>
  )
}

const FlightSearchBar = ({ onSearch, className }) => {
  const dispatch = useDispatch()
  const {
    airports = [],
    loading: airportsLoading,
    error: airportsError,
  } = useSelector((state) => state.airport)
  const [tripType, setTripType] = React.useState("oneWay")
  const [specialFare, setSpecialFare] = React.useState("regular")
  const [directOnly, setDirectOnly] = React.useState(false)
  const [passengersOpen, setPassengersOpen] = React.useState(false)
  const [searchData, setSearchData] = React.useState({
    departureAirportId: "",
    arrivalAirportId: "",
    departureDate: today,
    returnDate: null,
    numberOfTravellers: 1,
    cabinClass: "ECONOMY",
  })
  const [segments, setSegments] = React.useState([
    createSegment({ departureDate: today }),
    createSegment(),
  ])

  const loadAirports = React.useCallback(() => {
    dispatch(listAllAirports({ page: 0, size: 100, sortBy: "name", sortDirection: "asc" }))
  }, [dispatch])

  React.useEffect(() => {
    loadAirports()
  }, [loadAirports])

  const updateSearchData = (key, value) => {
    setSearchData((previous) => ({ ...previous, [key]: value }))
  }

  const handleTripTypeChange = (type) => {
    if (type === "multiCity" && searchData.departureAirportId) {
      setSegments((current) => [
        createSegment({
          departureAirportId: searchData.departureAirportId,
          arrivalAirportId: searchData.arrivalAirportId,
          departureDate: searchData.departureDate,
        }),
        createSegment({
          departureAirportId: searchData.arrivalAirportId,
          departureDate: searchData.returnDate,
        }),
        ...current.slice(2),
      ])
    }
    setTripType(type)
  }

  const handleSwapAirports = () => {
    setSearchData((previous) => ({
      ...previous,
      departureAirportId: previous.arrivalAirportId,
      arrivalAirportId: previous.departureAirportId,
    }))
  }

  const updateSegment = (segmentId, key, value) => {
    setSegments((current) => {
      const segmentIndex = current.findIndex((segment) => segment.id === segmentId)

      return current.map((segment, index) => {
        if (segment.id === segmentId) return { ...segment, [key]: value }
        if (key === "arrivalAirportId" && index === segmentIndex + 1 && !segment.departureAirportId) {
          return { ...segment, departureAirportId: value }
        }
        if (key === "departureDate" && index > segmentIndex && segment.departureDate && segment.departureDate < value) {
          return { ...segment, departureDate: null }
        }
        return segment
      })
    })
  }

  const addSegment = () => {
    const previousSegment = segments.at(-1)
    setSegments((current) => [
      ...current,
      createSegment({
        departureAirportId: previousSegment?.arrivalAirportId || "",
        departureDate: previousSegment?.departureDate || null,
      }),
    ])
  }

  const removeSegment = (segmentId) => {
    setSegments((current) => current.filter((segment) => segment.id !== segmentId))
  }

  const adjustPassengers = (amount) => {
    setSearchData((previous) => ({
      ...previous,
      numberOfTravellers: Math.max(1, Math.min(9, previous.numberOfTravellers + amount)),
    }))
  }

  const isStandardSearchValid = Boolean(
    searchData.departureAirportId &&
    searchData.arrivalAirportId &&
    searchData.departureDate &&
    (tripType !== "roundTrip" || searchData.returnDate),
  )
  const isMultiCityValid = segments.every((segment, index) => (
    segment.departureAirportId &&
    segment.arrivalAirportId &&
    segment.departureDate &&
    (index === 0 || segment.departureDate >= segments[index - 1].departureDate)
  ))
  const canSearch = tripType === "multiCity" ? isMultiCityValid : isStandardSearchValid
  const searchDisabledReason = airportsError
    ? "Airport data is not available yet."
    : tripType === "roundTrip" && !searchData.returnDate
      ? "Select a return date to search round trips."
      : !canSearch
        ? "Select route and departure date."
        : ""

  const handleSearch = () => {
    if (!canSearch) return
    const primarySegment = tripType === "multiCity" ? segments[0] : searchData

    onSearch?.({
      ...searchData,
      departureAirportId: primarySegment.departureAirportId,
      arrivalAirportId: primarySegment.arrivalAirportId,
      departureDate: formatApiDate(primarySegment.departureDate),
      returnDate: tripType === "roundTrip" ? searchData.returnDate : null,
      tripType,
      directOnly,
      specialFare,
      segments: tripType === "multiCity"
        ? segments.map(({ departureAirportId, arrivalAirportId, departureDate }) => ({
            departureAirportId,
            arrivalAirportId,
            departureDate: formatApiDate(departureDate),
          }))
        : [],
    })
  }

  return (
    <div className={cn("overflow-hidden rounded-[1.75rem] border bg-card shadow-2xl shadow-slate-950/10", className)}>
      <div className="border-b bg-muted/35 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid grid-cols-3 rounded-xl border bg-background p-1 shadow-sm">
            {tripTypes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleTripTypeChange(id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:px-5 sm:text-sm",
                  tripType === id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="hidden h-4 w-4 sm:block" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <label className="flex cursor-pointer items-center gap-3">
              <Switch checked={directOnly} onCheckedChange={setDirectOnly} aria-label="Direct flights only" />
              <span>
                <span className="block text-sm font-semibold">Direct flights only</span>
                <span className="block text-[11px] text-muted-foreground">Skip connections</span>
              </span>
            </label>
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CircleDot className="h-3.5 w-3.5 text-emerald-500" />
              Live availability
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {tripType === "multiCity" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Build your itinerary</p>
                <p className="text-xs text-muted-foreground">Add up to 5 flights in one search</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{segments.length} flights</span>
            </div>

            {segments.map((segment, index) => (
              <div key={segment.id} className="relative rounded-2xl border bg-muted/20 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{index + 1}</span>
                    Flight {index + 1}
                  </span>
                  {segments.length > 2 && (
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeSegment(segment.id)} aria-label={`Remove flight ${index + 1}`}>
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_0.8fr]">
                  <FieldShell icon={Plane} label="From">
                    <AirportSelect
                      airports={airports}
                      excludedAirportId={segment.arrivalAirportId}
                      value={segment.departureAirportId}
                      onChange={(value) => updateSegment(segment.id, "departureAirportId", value)}
                      placeholder="Leaving from"
                      loading={airportsLoading}
                      error={airportsError}
                      onRetry={loadAirports}
                    />
                  </FieldShell>
                  <div className="hidden items-center text-muted-foreground lg:flex"><ArrowLeftRight className="h-4 w-4" /></div>
                  <FieldShell icon={MapPin} label="To">
                    <AirportSelect
                      airports={airports}
                      excludedAirportId={segment.departureAirportId}
                      value={segment.arrivalAirportId}
                      onChange={(value) => updateSegment(segment.id, "arrivalAirportId", value)}
                      placeholder="Going to"
                      loading={airportsLoading}
                      error={airportsError}
                      onRetry={loadAirports}
                    />
                  </FieldShell>
                  <DateField
                    date={segment.departureDate}
                    label="Departure"
                    minimumDate={index === 0 ? today : segments[index - 1].departureDate || today}
                    onChange={(date) => updateSegment(segment.id, "departureDate", date)}
                    helper={`Flight ${index + 1} date`}
                  />
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addSegment} disabled={segments.length >= 5} className="h-10 rounded-xl border-dashed">
              <Plus className="mr-2 h-4 w-4" /> Add another flight
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.2fr_auto_1.2fr_0.9fr_0.9fr]">
            <FieldShell icon={Plane} label="From">
              <AirportSelect
                airports={airports}
                excludedAirportId={searchData.arrivalAirportId}
                value={searchData.departureAirportId}
                onChange={(value) => updateSearchData("departureAirportId", value)}
                placeholder="Leaving from"
                loading={airportsLoading}
                error={airportsError}
                onRetry={loadAirports}
              />
            </FieldShell>

            <button
              type="button"
              onClick={handleSwapAirports}
              aria-label="Swap departure and arrival airports"
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border bg-card text-primary shadow-sm transition hover:border-primary/40 hover:bg-primary/5 md:col-span-2 lg:col-span-1 lg:my-auto lg:-mx-5 lg:z-10"
            >
              <ArrowLeftRight className="h-4 w-4 lg:rotate-90" />
            </button>

            <FieldShell icon={MapPin} label="To">
              <AirportSelect
                airports={airports}
                excludedAirportId={searchData.departureAirportId}
                value={searchData.arrivalAirportId}
                onChange={(value) => updateSearchData("arrivalAirportId", value)}
                placeholder="Going to"
                loading={airportsLoading}
                error={airportsError}
                onRetry={loadAirports}
              />
            </FieldShell>

            <DateField
              date={searchData.departureDate}
              label="Departure"
              onChange={(date) => {
                updateSearchData("departureDate", date)
                if (searchData.returnDate && date > searchData.returnDate) updateSearchData("returnDate", null)
              }}
            />

            {tripType === "roundTrip" ? (
              <DateField
                date={searchData.returnDate}
                label="Return"
                minimumDate={searchData.departureDate || today}
                onChange={(date) => updateSearchData("returnDate", date)}
                helper="Return date"
              />
            ) : (
              <button type="button" onClick={() => handleTripTypeChange("roundTrip")} className="text-left">
                <FieldShell icon={CalendarDays} label="Return" className="h-full border-dashed bg-muted/20">
                  <p className="text-base font-semibold text-primary">Add return</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Compare round-trip fares</p>
                </FieldShell>
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 border-t pt-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Traveler fares</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {travelerFares.map((fare) => (
                <button
                  key={fare.id}
                  type="button"
                  onClick={() => setSpecialFare(fare.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    specialFare === fare.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {specialFare === fare.id && <Check className="mr-1 inline h-3 w-3" />}
                  {fare.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_minmax(220px,1fr)_minmax(180px,auto)] 2xl:w-auto">
            <Dialog open={passengersOpen} onOpenChange={setPassengersOpen}>
              <DialogTrigger asChild>
                <button type="button" className="rounded-xl border bg-background px-4 py-3 text-left transition hover:border-primary/40">
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><Users className="h-3.5 w-3.5 text-primary" /> Travelers</span>
                  <span className="mt-1.5 flex items-center justify-between text-sm font-semibold">{searchData.numberOfTravellers} {searchData.numberOfTravellers === 1 ? "traveler" : "travelers"} <ChevronDown className="h-4 w-4 text-muted-foreground" /></span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Travelers</DialogTitle></DialogHeader>
                <div className="flex items-center justify-between py-4">
                  <div><p className="font-medium">Passengers</p><p className="text-sm text-muted-foreground">Maximum 9 per booking</p></div>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="icon" onClick={() => adjustPassengers(-1)} disabled={searchData.numberOfTravellers === 1}><Minus /></Button>
                    <span className="w-5 text-center font-semibold">{searchData.numberOfTravellers}</span>
                    <Button type="button" variant="outline" size="icon" onClick={() => adjustPassengers(1)} disabled={searchData.numberOfTravellers === 9}><Plus /></Button>
                  </div>
                </div>
                <Button type="button" onClick={() => setPassengersOpen(false)} className="h-10">Done</Button>
              </DialogContent>
            </Dialog>

            <Select value={searchData.cabinClass} onValueChange={(value) => updateSearchData("cabinClass", value)}>
              <SelectTrigger className="h-auto min-h-16 w-full min-w-0 rounded-xl border bg-background px-4 py-3 text-left shadow-none">
                <div className="min-w-0 space-y-2">
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><Plane className="h-3.5 w-3.5 text-primary" /> Cabin class</span>
                  <span className="block truncate text-sm font-semibold leading-none"><SelectValue /></span>
                </div>
              </SelectTrigger>
              <SelectContent className="min-w-72 p-1.5" position="popper" align="end">
                {cabinClasses.map((cabin) => (
                  <SelectItem key={cabin.value} value={cabin.value} className="mb-1 items-start px-3 py-3 last:mb-0">
                    <span className="block pr-4">
                      <span className="block font-semibold leading-5">{cabin.label}</span>
                      <span className="mt-1 block text-xs leading-4 text-muted-foreground">{cabin.description}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              onClick={handleSearch}
              disabled={!canSearch}
              title={searchDisabledReason}
              className="h-auto min-h-16 min-w-0 rounded-xl px-7 text-sm font-bold shadow-lg shadow-primary/20 sm:col-span-2 lg:col-span-1"
            >
              <Search className="mr-2 h-4 w-4" />
              Search {tripType === "multiCity" ? `${segments.length} flights` : "flights"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlightSearchBar
