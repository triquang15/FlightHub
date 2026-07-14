import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  AlertCircle,
  Clock,
  DollarSign,
  ImageIcon,
  Info,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  deleteFlightMeal,
  updateFlightMealAvailability,
} from "@/Redux/flightMeal/flightMealThunk";

const typeLabel = (value) => String(value || "OTHER").replaceAll("_", " ");

const formatMoney = (amount, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="rounded-md border border-border bg-muted/20 p-3">
    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      {Icon && <Icon className="size-3.5" />}
      {label}
    </div>
    <div className="mt-1 font-semibold text-foreground">{value}</div>
  </div>
);

const FlightMealCard = ({ flightMeal }) => {
  const dispatch = useDispatch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const meal = flightMeal?.meal || {};
  const currency = flightMeal?.currency || meal.currency || "USD";
  const displayPrice = Number.isFinite(Number(flightMeal?.price)) ? Number(flightMeal.price) : 0;

  const handleToggleAvailability = async () => {
    try {
      await dispatch(
        updateFlightMealAvailability({
          flightMealId: flightMeal.id,
          available: !flightMeal.available,
        }),
      ).unwrap();
      toast.success("Flight meal availability updated");
    } catch (err) {
      toast.error("Unable to update flight meal", { description: String(err) });
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteFlightMeal(flightMeal.id)).unwrap();
      toast.success("Meal removed from flight", {
        description: meal?.name ? `${meal.name} is no longer sold on this flight.` : undefined,
      });
      setConfirmOpen(false);
    } catch (err) {
      toast.error("Unable to remove meal", { description: String(err) });
    }
  };

  return (
    <>
      <Card className="overflow-hidden rounded-md border-border bg-card transition-colors hover:border-primary/40">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
            <div className="relative min-h-44 bg-muted/40">
              {meal.imageUrl ? (
                <img src={meal.imageUrl} alt={meal.name} className="h-full min-h-44 w-full object-cover" />
              ) : (
                <div className="flex h-full min-h-44 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="size-8" />
                  <span className="text-xs font-medium">No image</span>
                </div>
              )}
              <Badge className="absolute left-3 top-3 bg-background/90 text-foreground backdrop-blur">
                {meal.code || "MEAL"}
              </Badge>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <UtensilsCrossed className="size-3" />
                      {typeLabel(meal.mealType)}
                    </Badge>
                    {meal.dietaryRestriction && (
                      <Badge variant="outline">{typeLabel(meal.dietaryRestriction)}</Badge>
                    )}
                    {meal.available === false && <Badge variant="destructive">Catalog unavailable</Badge>}
                  </div>
                  <h3 className="truncate text-lg font-semibold text-foreground">{meal.name || "Unnamed meal"}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {meal.ingredients || meal.description || "No ingredients or description available."}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Switch checked={flightMeal.available} onCheckedChange={handleToggleAvailability} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove meal from flight"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InfoItem icon={DollarSign} label="Sellable price" value={formatMoney(displayPrice, currency)} />
                <InfoItem icon={Info} label="Display order" value={flightMeal.displayOrder ?? 0} />
                <InfoItem
                  icon={Clock}
                  label="Advance booking"
                  value={meal.requiresAdvanceBooking ? `${meal.advanceBookingHours || "Required"}h` : "Not required"}
                />
                <InfoItem
                  icon={AlertCircle}
                  label="Status"
                  value={flightMeal.available ? "Available for sale" : "Hidden from sale"}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove meal from this flight?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {meal?.name || "this meal"} from future sale on this flight. Existing booking records keep their historical snapshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove meal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FlightMealCard;
