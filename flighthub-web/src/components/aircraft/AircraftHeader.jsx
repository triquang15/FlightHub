import { CalendarDays, Edit, Gauge, MapPin, Plane, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const statusClass = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  MAINTENANCE: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  INACTIVE: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
  RETIRED: "border-border bg-muted text-muted-foreground",
};

const formatDate = (value) => {
  if (!value) return "Not configured";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not configured"
    : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
};

const Metric = ({ icon: Icon, label, value }) => (
  <div className="min-w-0">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </div>
    <p className="mt-1 truncate text-sm font-medium">{value || "Not configured"}</p>
  </div>
);

const AircraftHeader = ({ aircraft, cabinCount, onEdit }) => {
  const status = String(aircraft.status || "UNKNOWN").toUpperCase();
  const seats = aircraft.seatingCapacity || aircraft.totalSeats || 0;

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Plane className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold">{aircraft.code || "Aircraft"}</h2>
                <Badge variant="outline" className={statusClass[status] || ""}>{status}</Badge>
                <Badge variant="outline">{aircraft.isAvailable ? "Schedulable" : "Unavailable"}</Badge>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {[aircraft.manufacturer, aircraft.model].filter(Boolean).join(" · ") || "Model details not configured"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit />
            Edit aircraft
          </Button>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Users} label="Capacity" value={`${seats.toLocaleString()} seats · ${cabinCount} cabins`} />
          <Metric icon={Gauge} label="Range" value={aircraft.rangeKm ? `${aircraft.rangeKm.toLocaleString()} km` : null} />
          <Metric icon={MapPin} label="Current airport ID" value={aircraft.currentAirportId || aircraft.currentLocation} />
          <Metric icon={CalendarDays} label="Next maintenance" value={formatDate(aircraft.nextMaintenanceDate)} />
        </div>
      </CardContent>
    </Card>
  );
};

export default AircraftHeader;
