import { useEffect } from "react";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { createMeal, fetchMealById, updateMeal } from "../../../../Redux/meal/mealThunk";
import { clearCurrentMeal, clearMealError } from "../../../../Redux/meal/mealSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Loader } from "@/components/common/Loader";
import MealForm from "./MealForm";

const MealFormPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentMeal, loading, error } = useSelector((state) => state.meal);
  const isEditMode = Boolean(id);

  useEffect(() => {
    dispatch(clearMealError());
    dispatch(clearCurrentMeal());
    if (isEditMode) dispatch(fetchMealById(id));
    return () => {
      dispatch(clearMealError());
      dispatch(clearCurrentMeal());
    };
  }, [dispatch, id, isEditMode]);

  const handleSubmit = async (mealData) => {
    try {
      const saved = isEditMode
        ? await dispatch(updateMeal({ mealId: Number(id), mealData })).unwrap()
        : await dispatch(createMeal(mealData)).unwrap();
      toast.success(isEditMode ? "Meal updated" : "Meal created", {
        description: `${saved?.name || mealData.name} is ready in the catalog.`,
      });
      navigate("/airline/meals");
    } catch (err) {
      toast.error(isEditMode ? "Unable to update meal" : "Unable to create meal", {
        description: String(err),
      });
    }
  };

  if (isEditMode && loading && !currentMeal) {
    return <Loader />;
  }

  if (isEditMode && error && !currentMeal) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-md border border-border bg-card p-6 text-center">
        <p className="font-medium text-foreground">Meal unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/airline/meals")}>
          Back to meals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start">
        <Button variant="ghost" size="icon" aria-label="Back to meals" onClick={() => navigate("/airline/meals")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex min-w-0 gap-4">
          <div className="hidden size-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary sm:flex">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-primary">Service catalog</p>
            <h1 className="text-2xl font-semibold text-foreground">{isEditMode ? "Edit Meal" : "Create Meal"}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {isEditMode ? "Update a reusable meal catalog item." : "Create a reusable meal catalog item before assigning it to flights."}
            </p>
          </div>
        </div>
      </header>

      <Card className="rounded-md border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Meal Details</CardTitle>
          <CardDescription>
            Codes are airline-scoped and should stay stable once assigned to flights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MealForm onSubmit={handleSubmit} onCancel={() => navigate("/airline/meals")} />
        </CardContent>
      </Card>
    </div>
  );
};

export default MealFormPage;
