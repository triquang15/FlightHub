import React, { useMemo, useState } from "react";
import { DollarSign, ImageIcon, Plus, Trash2, UtensilsCrossed } from "lucide-react";

import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Switch } from "../../../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";

const CURRENCIES = ["USD", "VND", "SGD", "THB", "MYR"];

const typeLabel = (value) => String(value || "OTHER").replaceAll("_", " ");

const formatMoney = (amount, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const MealThumb = ({ meal }) => (
  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
    {meal?.imageUrl ? (
      <img src={meal.imageUrl} alt={meal.name} className="h-full w-full object-cover" />
    ) : (
      <ImageIcon className="size-5 text-muted-foreground" />
    )}
  </div>
);

const FlightMealForm = ({
  flightId,
  availableMeals = [],
  assignedMeals = [],
  onSubmit,
  onCancel,
}) => {
  const [selectedMeals, setSelectedMeals] = useState([]);

  const assignedMealIds = useMemo(
    () => new Set((assignedMeals || []).map((flightMeal) => flightMeal?.meal?.id).filter(Boolean)),
    [assignedMeals],
  );
  const selectedMealIds = useMemo(
    () => new Set(selectedMeals.map((meal) => meal.mealId)),
    [selectedMeals],
  );
  const unassignedMeals = useMemo(
    () =>
      (availableMeals || [])
        .filter((meal) => meal?.id && !assignedMealIds.has(meal.id) && !selectedMealIds.has(meal.id))
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || String(a.name).localeCompare(String(b.name))),
    [assignedMealIds, availableMeals, selectedMealIds],
  );

  const handleAddMeal = (mealId) => {
    const meal = availableMeals.find((item) => item.id === Number(mealId));
    if (!meal || selectedMealIds.has(meal.id) || assignedMealIds.has(meal.id)) return;

    setSelectedMeals((current) => [
      ...current,
      {
        mealId: meal.id,
        meal,
        available: meal.available !== false,
        price: Number.isFinite(Number(meal.price)) ? Number(meal.price) : 0,
        currency: String(meal.currency || "USD").toUpperCase(),
        displayOrder: assignedMealIds.size + current.length,
      },
    ]);
  };

  const handleRemoveMeal = (mealId) => {
    setSelectedMeals((current) => current.filter((meal) => meal.mealId !== mealId));
  };

  const handleUpdateMeal = (mealId, field, value) => {
    setSelectedMeals((current) =>
      current.map((meal) => (meal.mealId === mealId ? { ...meal, [field]: value } : meal)),
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const flightMealsData = selectedMeals.map((meal) => ({
      flightId: Number(flightId),
      mealId: meal.mealId,
      available: Boolean(meal.available),
      price: Number(meal.price || 0),
      currency: String(meal.currency || "USD").toUpperCase(),
      displayOrder: Number(meal.displayOrder || 0),
    }));
    onSubmit(flightMealsData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="rounded-md border border-border bg-muted/20 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Label>Add meal catalog item</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Only unassigned catalog meals are shown. Flight price and availability can be overridden here.
            </p>
          </div>
          <Select onValueChange={handleAddMeal}>
            <SelectTrigger className="w-full lg:w-96">
              <SelectValue placeholder="Choose a meal to assign" />
            </SelectTrigger>
            <SelectContent>
              {unassignedMeals.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  All catalog meals are already assigned to this flight.
                </div>
              ) : (
                unassignedMeals.map((meal) => (
                  <SelectItem key={meal.id} value={String(meal.id)} disabled={meal.available === false}>
                    {meal.code} - {meal.name}
                    {meal.available === false ? " (catalog unavailable)" : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </section>

      {selectedMeals.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed border-border bg-card p-6 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary">
            <UtensilsCrossed className="size-6" />
          </div>
          <p className="font-medium text-foreground">No meals selected yet</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Pick catalog meals above, then set sellable price, currency, availability, and display order for this flight.
          </p>
        </div>
      ) : (
        <section className="grid gap-3">
          {selectedMeals.map((item) => {
            const meal = item.meal;
            return (
              <article key={item.mealId} className="rounded-md border border-border bg-card p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <MealThumb meal={meal} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-foreground">{meal.name}</p>
                        <Badge variant="outline">{meal.code}</Badge>
                        <Badge variant="secondary">{typeLabel(meal.mealType)}</Badge>
                        {meal.dietaryRestriction && (
                          <Badge variant="outline">{typeLabel(meal.dietaryRestriction)}</Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {meal.ingredients || "No ingredients listed."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px] xl:grid-cols-[1fr_120px_110px]">
                    <div className="space-y-1">
                      <Label className="text-xs">Price</Label>
                      <div className="relative">
                        <DollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(event) => handleUpdateMeal(item.mealId, "price", event.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Preview {formatMoney(item.price, item.currency)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Currency</Label>
                      <Select value={item.currency} onValueChange={(value) => handleUpdateMeal(item.mealId, "currency", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Order</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.displayOrder}
                        onChange={(event) => handleUpdateMeal(item.mealId, "displayOrder", event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 xl:w-44 xl:justify-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.available}
                        onCheckedChange={(checked) => handleUpdateMeal(item.mealId, "available", checked)}
                      />
                      <span className="text-sm text-muted-foreground">Sellable</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveMeal(item.mealId)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <div className="flex flex-col-reverse gap-2 rounded-md border border-border bg-card/95 p-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={selectedMeals.length === 0}>
          <Plus className="size-4" />
          Assign {selectedMeals.length} meal{selectedMeals.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </form>
  );
};

export default FlightMealForm;
