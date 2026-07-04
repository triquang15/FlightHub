import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, RefreshCw, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  deleteMeal,
  fetchMealsByAirlineId,
  updateMealAvailability,
} from "../../../../Redux/meal/mealThunk";
import { clearMealError } from "../../../../Redux/meal/mealSlice";

const toMealArray = (payload) => (Array.isArray(payload) ? payload : payload?.content || []);
const typeLabel = (value) => String(value || "OTHER").replaceAll("_", " ");

const formatMoney = (amount, currency = "USD") =>
  Number(amount) > 0
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(Number(amount))
    : "Free";

const Stat = ({ label, value, detail }) => (
  <div className="border-r border-border px-4 py-3 last:border-r-0">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  </div>
);

const IconAction = ({ label, icon: Icon, onClick }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button type="button" variant="ghost" size="icon" aria-label={label} onClick={onClick}>
        <Icon className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const MealManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { meals, loading, error } = useSelector((state) => state.meal);
  const [search, setSearch] = useState("");
  const [mealType, setMealType] = useState("ALL");
  const [availability, setAvailability] = useState("ALL");
  const [mealToDelete, setMealToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchMealsByAirlineId());
  }, [dispatch]);

  useEffect(() => {
    return () => dispatch(clearMealError());
  }, [dispatch]);

  const mealList = useMemo(() => toMealArray(meals), [meals]);
  const types = useMemo(
    () => Array.from(new Set(mealList.map((meal) => meal.mealType).filter(Boolean))).sort(),
    [mealList],
  );
  const availableCount = mealList.filter((meal) => meal.available).length;
  const advanceCount = mealList.filter((meal) => meal.requiresAdvanceBooking).length;
  const dietaryCount = mealList.filter((meal) => meal.dietaryRestriction).length;

  const filteredMeals = useMemo(() => {
    const query = search.trim().toLowerCase();
    return mealList.filter((meal) => {
      const matchesSearch =
        !query ||
        meal.name?.toLowerCase().includes(query) ||
        meal.code?.toLowerCase().includes(query) ||
        meal.ingredients?.toLowerCase().includes(query);
      const matchesType = mealType === "ALL" || meal.mealType === mealType;
      const matchesAvailability =
        availability === "ALL" ||
        (availability === "AVAILABLE" && meal.available) ||
        (availability === "UNAVAILABLE" && !meal.available);
      return matchesSearch && matchesType && matchesAvailability;
    });
  }, [availability, mealList, mealType, search]);

  const handleToggleAvailability = async (mealId, currentAvailability) => {
    try {
      await dispatch(updateMealAvailability({ mealId, available: !currentAvailability })).unwrap();
      toast.success("Meal availability updated");
    } catch (err) {
      toast.error("Unable to update availability", { description: String(err) });
    }
  };

  const confirmDelete = async () => {
    if (!mealToDelete) return;
    try {
      await dispatch(deleteMeal(mealToDelete.id)).unwrap();
      toast.success("Meal deleted", {
        description: `${mealToDelete.name} was removed from the catalog.`,
      });
      setMealToDelete(null);
    } catch (err) {
      toast.error("Unable to delete meal", { description: String(err) });
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-5 pb-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <UtensilsCrossed className="size-4" />
              Service catalog
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Meals</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage reusable meal catalog items before assigning them to individual flights.
            </p>
          </div>
          <Button onClick={() => navigate("/airline/meals/new")}>
            <Plus className="size-4" />
            Create meal
          </Button>
        </header>

        <section className="grid overflow-hidden rounded-md border border-border bg-card sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Catalog meals" value={mealList.length} detail="total" />
          <Stat label="Available" value={availableCount} detail="items" />
          <Stat label="Advance booking" value={advanceCount} detail="items" />
          <Stat label="Dietary tagged" value={dietaryCount} detail="items" />
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Meal register</h2>
              <p className="text-xs text-muted-foreground">
                Showing {filteredMeals.length} of {mealList.length} meals.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, code or ingredients"
                  className="pl-9"
                />
              </div>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>{typeLabel(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All status</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => dispatch(fetchMealsByAirlineId())}>
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </div>
          </div>

          {loading && mealList.length === 0 ? (
            <div className="space-y-3 p-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-20 w-full" />)}</div>
          ) : error ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" onClick={() => dispatch(fetchMealsByAirlineId())}>
                <RefreshCw className="size-4" /> Retry
              </Button>
            </div>
          ) : filteredMeals.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
              <UtensilsCrossed className="mb-3 size-9 text-muted-foreground" />
              <p className="font-medium text-foreground">No matching meals</p>
              <p className="mt-1 text-sm text-muted-foreground">Create a meal or adjust the current filters.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[980px] table-fixed text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="w-[28%] px-4 py-3 font-medium">Meal</th>
                      <th className="w-[16%] px-4 py-3 font-medium">Type</th>
                      <th className="w-[16%] px-4 py-3 font-medium">Dietary</th>
                      <th className="w-[14%] px-4 py-3 font-medium">Price</th>
                      <th className="w-[12%] px-4 py-3 font-medium">Available</th>
                      <th className="sticky right-0 w-[14%] border-l border-border bg-muted/95 px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredMeals.map((meal) => (
                      <tr key={meal.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{meal.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Code {meal.code}</p>
                        </td>
                        <td className="px-4 py-3"><Badge variant="outline">{typeLabel(meal.mealType)}</Badge></td>
                        <td className="px-4 py-3">
                          {meal.dietaryRestriction ? <Badge variant="secondary">{typeLabel(meal.dietaryRestriction)}</Badge> : <span className="text-xs text-muted-foreground">Regular</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{formatMoney(meal.price, meal.currency || "USD")}</td>
                        <td className="px-4 py-3">
                          <Switch checked={meal.available} onCheckedChange={() => handleToggleAvailability(meal.id, meal.available)} aria-label={`Toggle ${meal.name}`} />
                        </td>
                        <td className="sticky right-0 border-l border-border bg-card px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <IconAction label="Edit meal" icon={Edit} onClick={() => navigate(`/airline/meals/${meal.id}/edit`)} />
                            <IconAction label="Delete meal" icon={Trash2} onClick={() => setMealToDelete(meal)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 lg:hidden">
                {filteredMeals.map((meal) => (
                  <Card key={meal.id} className="rounded-md border-border bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{meal.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Code {meal.code}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <IconAction label="Edit meal" icon={Edit} onClick={() => navigate(`/airline/meals/${meal.id}/edit`)} />
                          <IconAction label="Delete meal" icon={Trash2} onClick={() => setMealToDelete(meal)} />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline">{typeLabel(meal.mealType)}</Badge>
                        {meal.dietaryRestriction && <Badge variant="secondary">{typeLabel(meal.dietaryRestriction)}</Badge>}
                        <Badge variant={meal.available ? "default" : "secondary"}>{meal.available ? "Available" : "Unavailable"}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>

        <AlertDialog open={Boolean(mealToDelete)} onOpenChange={(open) => !open && setMealToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete meal?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes {mealToDelete?.name} from the meal catalog. It cannot be deleted if active flight meal offers still reference it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep meal</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete meal</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default MealManagement;
