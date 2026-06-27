import {
  BadgeCheck,
  Briefcase,
  Check,
  Luggage,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatMoney = (amount, currency = "USD") => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Unavailable";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const fareTotal = (fare) => fare?.totalPrice ?? fare?.currentPrice ?? fare?.baseFare ?? 0;

const Feature = ({ icon: Icon, label, active }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
      active
        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
        : "bg-muted/40 text-muted-foreground",
    )}
  >
    <Icon className="h-3.5 w-3.5" />
    {label}
  </span>
);

const FareCard = ({ fare, isSelected, onSelect, passengerCount = 1 }) => {
  const currency = fare?.currency || "USD";
  const perTraveler = fareTotal(fare);
  const tripTotal = perTraveler * passengerCount;
  const fareName = fare?.name || fare?.fareLabel || "Standard";
  const displayLabel = fare?.fareLabel && fare.fareLabel.toLowerCase() !== "lowest fare" && fare.fareLabel !== fareName
    ? fare.fareLabel
    : null;
  const cabinLabel = (fare?.cabinClass || "ECONOMY").replace("_", " ");

  const features = [
    { icon: ShieldCheck, label: "Refund", active: fare?.fullRefund || fare?.partialRefund || fare?.fareRules?.isRefundable },
    { icon: Briefcase, label: "Baggage", active: Boolean(fare?.baggagePolicy) },
    { icon: Users, label: "Seat select", active: fare?.advanceSeatSelection || fare?.preferredSeatChoice },
    { icon: BadgeCheck, label: "Priority", active: fare?.priorityBoarding || fare?.priorityCheckin || fare?.fastTrackSecurity },
    { icon: Sparkles, label: "Meals/Wi-Fi", active: fare?.complimentaryMeals || fare?.inFlightEntertainment || fare?.inFlightInternet },
    { icon: Luggage, label: "Date change", active: fare?.freeDateChange || fare?.fareRules?.isChangeable },
  ];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group rounded-lg border bg-card p-4 text-left shadow-sm transition hover:border-primary/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isSelected && "border-primary shadow-md ring-2 ring-primary/20",
      )}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">{fareName}</h3>
            {displayLabel && <Badge variant="outline" className="rounded-md">{displayLabel}</Badge>}
            <Badge variant="secondary" className="rounded-md capitalize">{cabinLabel.toLowerCase()}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {features.map((feature) => (
              <Feature key={feature.label} {...feature} />
            ))}
          </div>
        </div>

        <div className="min-w-40 sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Per traveler</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatMoney(perTraveler, currency)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Base {formatMoney(fare?.baseFare || 0, currency)} · Taxes {formatMoney(fare?.taxesAndFees || 0, currency)}
          </p>
          {passengerCount > 1 && (
            <p className="mt-1 text-sm font-medium text-foreground">{formatMoney(tripTotal, currency)} total</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
        <span className={cn("inline-flex items-center gap-2 text-sm font-medium", isSelected ? "text-primary" : "text-muted-foreground")}>
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border",
              isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
            )}
          >
            {isSelected && <Check className="h-3.5 w-3.5" />}
          </span>
          {isSelected ? "Selected" : "Available"}
        </span>

        <Button
          type="button"
          variant={isSelected ? "default" : "outline"}
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.();
          }}
        >
          {isSelected ? "Selected" : "Select fare"}
        </Button>
      </div>
    </button>
  );
};

export default FareCard;
