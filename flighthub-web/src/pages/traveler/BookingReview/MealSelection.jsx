import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Leaf,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const formatLabel = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getDietaryConfig = (restriction) => {
  const configs = {
    VEGETARIAN: {
      icon: Leaf,
      label: "Vegetarian",
      className: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-200",
    },
    VEGAN: {
      icon: Leaf,
      label: "Vegan",
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
    },
    HALAL: {
      label: "Halal",
      className: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200",
    },
    KOSHER: {
      label: "Kosher",
      className: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200",
    },
    GLUTEN_FREE: {
      label: "Gluten Free",
      className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
    },
  };

  return (
    configs[restriction] || {
      label: formatLabel(restriction),
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    }
  );
};

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/90"
  >
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 dark:bg-orange-500/10">
        <UtensilsCrossed className="h-6 w-6 text-orange-600 dark:text-orange-300" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
          Meal Selection
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Pre-order meals when available for this flight.
        </p>
      </div>
    </div>
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-white/10 dark:bg-slate-950/40">
      <UtensilsCrossed className="mx-auto mb-3 h-10 w-10 text-slate-400 dark:text-slate-500" />
      <p className="text-sm font-semibold text-slate-950 dark:text-white">
        No meal options available
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        You can continue booking without a pre-ordered meal.
      </p>
    </div>
  </motion.div>
);

const MealSelection = ({ selectedMeals = [], onSelectMeal }) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAllMeals, setShowAllMeals] = useState(false);
  const { flightMeals, loading } = useSelector((state) => state.flightMeal);
  const selectedItems = Array.isArray(selectedMeals) ? selectedMeals : [];

  const mealsData = useMemo(() => {
    return normalizeList(flightMeals)
      .map((flightMeal) => {
        const meal = flightMeal?.meal || {};
        const id = flightMeal?.id ?? flightMeal?.flightMealId ?? meal?.id;
        const priceValue =
          flightMeal?.price ?? flightMeal?.totalPrice ?? meal?.price ?? 0;

        return {
          id,
          flightMealId: flightMeal?.id ?? flightMeal?.flightMealId,
          mealId: meal?.id,
          name: meal?.name || flightMeal?.name || "Meal option",
          description:
            meal?.description ||
            meal?.ingredients ||
            flightMeal?.description ||
            "Pre-ordered meal for this flight.",
          price: Number.isFinite(Number(priceValue)) ? Number(priceValue) : 0,
          available: flightMeal?.available !== false && flightMeal?.status !== "INACTIVE",
          complimentary: Boolean(flightMeal?.complimentary || meal?.complimentary),
          category: meal?.mealType || flightMeal?.category || "MEAL",
          dietaryRestriction: meal?.dietaryRestriction || flightMeal?.dietaryRestriction,
          imageUrl: meal?.imageUrl || flightMeal?.imageUrl,
          allergens: meal?.allergens || flightMeal?.allergens,
          ingredients: meal?.ingredients || flightMeal?.ingredients,
          code: meal?.code || flightMeal?.code,
          requiresAdvanceBooking:
            meal?.requiresAdvanceBooking || flightMeal?.requiresAdvanceBooking,
          advanceBookingHours:
            meal?.advanceBookingHours || flightMeal?.advanceBookingHours,
        };
      })
      .filter((meal) => meal.id !== null && meal.id !== undefined);
  }, [flightMeals]);

  const categories = useMemo(
    () => ["all", ...new Set(mealsData.map((meal) => meal.category).filter(Boolean))],
    [mealsData],
  );

  const filteredMeals =
    activeCategory === "all"
      ? mealsData
      : mealsData.filter((meal) => meal.category === activeCategory);

  const displayedMeals = showAllMeals ? filteredMeals : filteredMeals.slice(0, 4);
  const totalMealCost = selectedItems.reduce(
    (sum, meal) => sum + Number(meal.price || 0),
    0,
  );

  const isMealSelected = (mealId) =>
    selectedItems.some((meal) => meal.id === mealId);

  const handleMealToggle = (meal) => {
    if (!meal.available) return;

    if (isMealSelected(meal.id)) {
      onSelectMeal(selectedItems.filter((item) => item.id !== meal.id));
      return;
    }

    onSelectMeal([...selectedItems, meal]);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-600 dark:border-orange-300"></div>
        </div>
      </div>
    );
  }

  if (!mealsData.length) {
    return <EmptyState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 dark:bg-orange-500/10">
            <UtensilsCrossed className="h-6 w-6 text-orange-600 dark:text-orange-300" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Meal Selection
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Add optional meals before checkout.
            </p>
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left sm:text-right dark:border-white/10 dark:bg-slate-950/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">Selected</p>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            {selectedItems.length} meals | {currencyFormatter.format(totalMealCost)}
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => {
              setActiveCategory(category);
              setShowAllMeals(false);
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeCategory === category
                ? "bg-orange-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {category === "all" ? "All meals" : formatLabel(category)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {displayedMeals.map((meal) => {
            const isSelected = isMealSelected(meal.id);
            const dietaryConfig = getDietaryConfig(meal.dietaryRestriction);
            const DietaryIcon = dietaryConfig.icon;

            return (
              <motion.button
                key={meal.id}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onClick={() => handleMealToggle(meal)}
                disabled={!meal.available}
                className={`relative overflow-hidden rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-orange-500 bg-orange-50 shadow-sm dark:border-orange-400/70 dark:bg-orange-500/10"
                    : meal.available
                      ? "border-slate-200 bg-white hover:border-orange-300 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/30 dark:hover:border-orange-400/50"
                      : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70 dark:border-white/10 dark:bg-slate-950/30"
                }`}
              >
                {meal.imageUrl && (
                  <div className="h-28 overflow-hidden">
                    <img
                      src={meal.imageUrl}
                      alt={meal.name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                        {meal.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                        {meal.description}
                      </p>
                    </div>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isSelected
                          ? "border-orange-600 bg-orange-600 text-white"
                          : "border-slate-300 bg-white text-transparent dark:border-white/20 dark:bg-slate-900"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {meal.dietaryRestriction && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${dietaryConfig.className}`}
                      >
                        {DietaryIcon && <DietaryIcon className="h-3 w-3" />}
                        {dietaryConfig.label}
                      </span>
                    )}
                    {meal.code && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {meal.code}
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {formatLabel(meal.category)}
                    </span>
                  </div>

                  {meal.allergens && (
                    <div className="mb-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 dark:border-amber-400/20 dark:bg-amber-400/10">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-300" />
                      <p className="text-xs leading-5 text-amber-800 dark:text-amber-100">
                        Allergens: {meal.allergens}
                      </p>
                    </div>
                  )}

                  {meal.requiresAdvanceBooking && meal.advanceBookingHours && (
                    <div className="mb-2 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-2 dark:border-blue-400/20 dark:bg-blue-400/10">
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-300" />
                      <p className="text-xs leading-5 text-blue-800 dark:text-blue-100">
                        Book {meal.advanceBookingHours}h before departure
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-white/10">
                    <span className="text-sm font-bold text-slate-950 dark:text-white">
                      {meal.complimentary ? "Complimentary" : currencyFormatter.format(meal.price)}
                    </span>
                    {!meal.available && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-200">
                        <X className="h-3 w-3" />
                        Not available
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredMeals.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAllMeals((value) => !value)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-orange-50 py-3 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-200 dark:hover:bg-orange-500/15"
        >
          {showAllMeals ? (
            <>
              Show less <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Show {filteredMeals.length - 4} more meals{" "}
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}

      {selectedItems.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Selected meals ({selectedItems.length})
            </p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {currencyFormatter.format(totalMealCost)}
            </p>
          </div>
          <div className="space-y-2">
            {selectedItems.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between gap-3 rounded-md border border-white/70 bg-white p-3 text-sm shadow-sm dark:border-white/10 dark:bg-slate-950/50"
              >
                <div className="min-w-0 flex flex-1 items-center gap-3">
                  {meal.imageUrl ? (
                    <img
                      src={meal.imageUrl}
                      alt={meal.name}
                      className="h-10 w-10 shrink-0 rounded-md object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-orange-50 dark:bg-orange-500/10">
                      <UtensilsCrossed className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950 dark:text-white">
                      {meal.name}
                    </p>
                    {meal.dietaryRestriction && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getDietaryConfig(meal.dietaryRestriction).label}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {meal.complimentary ? "Free" : currencyFormatter.format(meal.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMealToggle(meal)}
                    className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                    aria-label={`Remove ${meal.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-white/10 dark:bg-slate-950/40">
          <UtensilsCrossed className="mx-auto mb-2 h-9 w-9 text-slate-400 dark:text-slate-500" />
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            No meals selected
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Meals are optional and can be skipped.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MealSelection;
