import * as React from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Luggage,
  Plane,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import FlightPricingModal from "./FlightPricing/FlightPricingModal";

const formatTime = (dateTime) => {
  if (!dateTime) return "--:--";
  return new Date(dateTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatDate = (dateTime) => {
  if (!dateTime) return "Date TBA";
  return new Date(dateTime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatMoney = (amount, currency = "USD") => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Fare unavailable";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const getFareTotal = (fare) => fare?.totalPrice ?? fare?.currentPrice ?? fare?.baseFare;
const getAirportCode = (airport) => airport?.iataCode || "--";
const getAirportName = (airport) => airport?.name || airport?.detailedName || "Airport details unavailable";
const getStopsLabel = (flight) => {
  const stops = flight.totalStops ?? flight.stops ?? 0;
  if (!stops) return "Non-stop";
  return `${stops} stop${stops > 1 ? "s" : ""}`;
};

const getInitials = (name) => {
  if (!name) return "FH";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const FlightMeta = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 rounded-md bg-muted/45 px-3 py-2 text-sm">
    <Icon className="h-4 w-4 text-primary" />
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

const Benefit = ({ icon: Icon, label, active }) => (
  <div
    className={cn(
      "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
      active ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200" : "bg-background text-muted-foreground",
    )}
  >
    <Icon className="h-4 w-4" />
    <span className="font-medium">{label}</span>
  </div>
);

const ModernFlightCard = ({
  flight,
  cabinClass,
  onViewDetails,
  onBookmark,
  isBookmarked = false,
  className,
  viewMode = "list",
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = React.useState(false);

  const fare = flight?.fare;
  const currency = fare?.currency || "USD";
  const totalFare = getFareTotal(fare);
  const cabinLabel = (fare?.cabinClass || cabinClass || "ECONOMY").replace("_", " ");
  const isBookable = Boolean(fare?.id && (flight?.availableSeats ?? 0) > 0);
  const lowSeatWarning = Number(flight?.availableSeats) > 0 && Number(flight?.availableSeats) <= 10;

  const benefits = [
    { icon: ShieldCheck, label: "Refund options", active: fare?.fullRefund || fare?.partialRefund || fare?.fareRules?.isRefundable },
    { icon: Luggage, label: "Baggage policy", active: Boolean(fare?.baggagePolicy) },
    { icon: Sparkles, label: "Seat choice", active: fare?.advanceSeatSelection || fare?.preferredSeatChoice },
    { icon: BadgeCheck, label: "Priority service", active: fare?.priorityBoarding || fare?.priorityCheckin },
  ];

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-lg border bg-card shadow-sm transition hover:border-primary/35 hover:shadow-md",
        viewMode === "grid" && "h-full",
        className,
      )}
    >
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[1fr_250px]">
          <div className="min-w-0 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-11 w-11 rounded-lg border">
                  <AvatarImage src={flight?.airlineLogo || flight?.airlineLogoUrl} alt="" />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {getInitials(flight?.airlineName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold">{flight?.airlineName || "Airline"}</h3>
                    <Badge variant="outline" className="rounded-md font-mono text-[11px]">
                      {flight?.flightNumber || "Flight"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">{cabinLabel.toLowerCase()} cabin</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onBookmark?.(flight)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                aria-label={isBookmarked ? "Remove saved flight" : "Save flight"}
              >
                {isBookmarked ? <BookmarkCheck className="h-4 w-4 fill-primary text-primary" /> : <Bookmark className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="min-w-0">
                <p className="text-3xl font-semibold tabular-nums">{formatTime(flight?.departureDateTime)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-bold text-primary">
                    {getAirportCode(flight?.departureAirport)}
                  </span>
                  <span className="truncate text-sm font-medium">{getAirportName(flight?.departureAirport)}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatDate(flight?.departureDateTime)}</p>
              </div>

              <div className="flex min-w-28 flex-col items-center">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">{flight?.formattedDuration || "Duration TBA"}</p>
                <div className="flex w-full items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="h-px flex-1 bg-border" />
                  <Plane className="h-4 w-4 text-primary" />
                  <span className="h-px flex-1 bg-border" />
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <p className="mt-2 text-xs font-medium text-muted-foreground">{getStopsLabel(flight)}</p>
              </div>

              <div className="min-w-0 text-right">
                <p className="text-3xl font-semibold tabular-nums">{formatTime(flight?.arrivalDateTime)}</p>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span className="truncate text-sm font-medium">{getAirportName(flight?.arrivalAirport)}</span>
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-bold text-primary">
                    {getAirportCode(flight?.arrivalAirport)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatDate(flight?.arrivalDateTime)}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <FlightMeta icon={Clock} label="Status" value={flight?.status || "Scheduled"} />
              <FlightMeta icon={Users} label="Seats" value={flight?.availableSeats ?? "-"} />
              <FlightMeta icon={Calendar} label="Gate" value={flight?.gate || "TBA"} />
            </div>

            {isExpanded && (
              <div className="mt-5 rounded-lg border bg-muted/20 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FlightMeta icon={Plane} label="Aircraft" value={flight?.aircraftCode || flight?.aircraftModal || "TBA"} />
                  <FlightMeta icon={Calendar} label="Terminal" value={flight?.terminal || "TBA"} />
                </div>
                <Separator className="my-4" />
                <div className="grid gap-2 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <Benefit key={benefit.label} {...benefit} />
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Final fare rules, baggage, meals, and seat options are confirmed during fare selection and checkout.
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              className="mt-4 h-9 px-0 text-primary hover:bg-transparent"
              onClick={() => {
                setIsExpanded((value) => !value);
                onViewDetails?.(flight);
              }}
            >
              {isExpanded ? "Hide details" : "View details"}
              {isExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
            </Button>
          </div>

          <div className="flex flex-col justify-between border-t bg-muted/30 p-5 lg:border-l lg:border-t-0">
            <div>
              {fare?.fareLabel && (
                <Badge className="mb-3 rounded-md bg-emerald-600 text-white">{fare.fareLabel}</Badge>
              )}
              {lowSeatWarning && (
                <p className="mb-2 text-sm font-semibold text-rose-600">{flight.availableSeats} seats left</p>
              )}
              <p className="text-sm text-muted-foreground">From</p>
              <p className="mt-1 text-3xl font-bold text-primary">{formatMoney(totalFare, currency)}</p>
              <p className="mt-1 text-xs text-muted-foreground">per traveler, taxes included when available</p>
            </div>

            <div className="mt-5 grid gap-2">
              <Button
                type="button"
                size="lg"
                disabled={!isBookable}
                onClick={() => setIsPricingModalOpen(true)}
                className="h-11 justify-between rounded-md px-4"
              >
                {isBookable ? "Choose fare" : "Unavailable"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                No payment until checkout
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      {isPricingModalOpen && (
        <FlightPricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          flight={flight}
        />
      )}
    </Card>
  );
};

export default ModernFlightCard;
