import React, { useEffect } from "react";
import { ArrowLeft, RefreshCw, UtensilsCrossed } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Loader } from "@/components/common/Loader";
import { fetchMealsByAirlineId } from "@/Redux/meal/mealThunk";
import { bulkCreateFlightMeals, fetchFlightMealsByFlightId } from "../../../../Redux/flightMeal/flightMealThunk";
import FlightMealForm from "./FlightMealForm";

const toArray = (payload) => (Array.isArray(payload) ? payload : payload?.content || payload?.items || []);

const FlightMealFormPage = () => {
  const { flightId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { flightMeals, loading: flightMealsLoading, error: flightMealError } = useSelector((state) => state.flightMeal);
  const { meals: availableMeals, loading: mealsLoading, error: mealError } = useSelector((state) => state.meal);

  const reload = () => {
    if (flightId) {
      dispatch(fetchFlightMealsByFlightId(flightId));
    }
    dispatch(fetchMealsByAirlineId());
  };

  useEffect(() => {
    reload();
  }, [dispatch, flightId]);

  const handleSubmit = async (flightMealsData) => {
    try {
      const created = await dispatch(bulkCreateFlightMeals(flightMealsData)).unwrap();
      const createdCount = toArray(created).length;
      toast.success("Flight meals assigned", {
        description: `${createdCount} meal${createdCount === 1 ? "" : "s"} added to this flight.`,
      });
      navigate(`/airline/flights/${flightId}`);
    } catch (err) {
      toast.error("Unable to assign flight meals", { description: String(err) });
    }
  };

  if (flightMealsLoading || mealsLoading) {
    return <Loader />;
  }

  const error = flightMealError || mealError;

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to flight meals"
            onClick={() => navigate(`/airline/flights/${flightId}`)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <UtensilsCrossed className="size-4" />
              Flight service catalog
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Assign Meals to Flight</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Select catalog meals, set per-flight price, currency, availability, and display priority.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={reload}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </header>

      {error ? (
        <Card className="rounded-md border-destructive/40 bg-card">
          <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="font-medium text-destructive">Unable to load meal assignment data</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={reload}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-md border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Meal Assignment</CardTitle>
            <CardDescription>
              Current assigned meals are excluded from the picker to prevent duplicate flight meal offers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FlightMealForm
              flightId={flightId}
              availableMeals={toArray(availableMeals)}
              assignedMeals={toArray(flightMeals)}
              onSubmit={handleSubmit}
              onCancel={() => navigate(`/airline/flights/${flightId}`)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlightMealFormPage;
