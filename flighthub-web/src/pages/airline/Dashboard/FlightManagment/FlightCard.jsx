import { ArrowRight, Edit, Eye, MapPin, Plane, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const statusClass = {
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
  CANCELLED: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
};

const airportLabel = (airport) => airport?.iataCode || airport?.name || "Unassigned";

const FlightCard = ({ flight, onEdit, onCancel, onView }) => {
  const cancelled = flight.status === "CANCELLED";
  const route = `${airportLabel(flight.departureAirport)} to ${airportLabel(flight.arrivalAirport)}`;
  const aircraft = [flight.aircraft?.code, flight.aircraft?.manufacturer, flight.aircraft?.model].filter(Boolean).join(" · ");

  return (
    <Card className="transition-colors hover:bg-muted/20">
      <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Plane className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold">{flight.flightNumber || `Flight ${flight.id}`}</p>
              <Badge variant="outline" className={statusClass[flight.status] || ""}>{flight.status || "UNKNOWN"}</Badge>
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{route}</span>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 flex-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Assigned aircraft</p>
            <p className="mt-1 truncate font-medium">{aircraft || "Not assigned"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Route cities</p>
            <p className="mt-1 truncate font-medium">
              {flight.departureAirport?.city?.name || "Unknown"} <ArrowRight className="mx-1 inline h-3 w-3" /> {flight.arrivalAirport?.city?.name || "Unknown"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
          <Button variant="outline" size="sm" onClick={onView}><Eye /> View</Button>
          <Button variant="outline" size="sm" onClick={onEdit} disabled={cancelled}><Edit /> Edit</Button>
          <Button variant="destructive" size="sm" onClick={onCancel} disabled={cancelled}><XCircle /> {cancelled ? "Cancelled" : "Cancel"}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightCard;
