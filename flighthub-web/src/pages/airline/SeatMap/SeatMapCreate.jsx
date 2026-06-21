import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Grid3X3, Plane, Rows3 } from "lucide-react";

import { getAircraftById } from "@/Redux/aircraft/aircraftThunks";
import { getCabinClassById } from "@/Redux/cabinClass/cabinClassThunk";
import { getSeatMapsByCabinClass } from "@/Redux/SeatMap/seatMapThunk";
import { clearCurrentSeatMap, clearSeatMapError } from "@/Redux/SeatMap/seatMapSlice";
import SeatMapForm from "@/components/seatMap/SeatMapForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/common/Loader";

const parseId = (value) => Number.parseInt(value, 10);

const SeatMapCreate = () => {
  const { aircraftId, cabinId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const numericAircraftId = useMemo(() => parseId(aircraftId), [aircraftId]);
  const numericCabinId = useMemo(() => parseId(cabinId), [cabinId]);
  const hasValidParams =
    Number.isInteger(numericAircraftId) &&
    numericAircraftId > 0 &&
    Number.isInteger(numericCabinId) &&
    numericCabinId > 0;

  const { currentAircraft, loading: aircraftLoading } = useSelector((state) => state.aircraft);
  const { cabinClass, loading: cabinLoading, error: cabinError } = useSelector((state) => state.cabinClass);
  const { seatMap, loading: seatMapLoading } = useSelector((state) => state.seatMap);

  useEffect(() => {
    if (!hasValidParams) return;

    dispatch(clearCurrentSeatMap());
    dispatch(getAircraftById(numericAircraftId));
    dispatch(getCabinClassById(numericCabinId));
    dispatch(getSeatMapsByCabinClass(numericCabinId))
      .unwrap()
      .catch(() => dispatch(clearSeatMapError()));
  }, [dispatch, hasValidParams, numericAircraftId, numericCabinId]);

  const goBackToAircraft = () => {
    navigate(hasValidParams ? `/airline/aircraft/${numericAircraftId}` : "/airline/aircraft");
  };

  const handleSuccess = (result) => {
    const createdSeatMapId = result?.id || seatMap?.id;
    if (createdSeatMapId) {
      navigate(`/airline/aircraft/${numericAircraftId}/cabin/${numericCabinId}/seat-map/${createdSeatMapId}`);
      return;
    }
    goBackToAircraft();
  };

  const existingSeatMapId = seatMap?.id || cabinClass?.seatMap?.id;
  const isLoading = (aircraftLoading || cabinLoading || seatMapLoading) && !cabinClass;

  if (!hasValidParams) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          Aircraft id or cabin id is invalid. Open this page from a valid aircraft detail screen.
        </div>
        <Button variant="outline" onClick={() => navigate("/airline/aircraft")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Aircraft
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <Loader message="Loading cabin and aircraft details..." />;
  }

  if (!cabinClass || cabinError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3 text-center">
            <h2 className="text-lg font-semibold">Cabin not found</h2>
            <p className="text-sm text-muted-foreground">
              {cabinError || "The requested cabin class could not be found."}
            </p>
            <Button onClick={goBackToAircraft}>Back to Aircraft</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-hidden">
      <div className="flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Grid3X3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
              <span>Aircraft {currentAircraft?.code || `#${numericAircraftId}`}</span>
              <span>/</span>
              <span>{cabinClass.name} cabin</span>
              <span>/</span>
              <span>Create seat map</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              Create Seat Map
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Build the row template that generates physical seats for inventory and operations.
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={goBackToAircraft} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
          Back to Aircraft
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Plane className="h-4 w-4" />
            Aircraft
          </div>
          <div className="mt-1 font-semibold">{currentAircraft?.code || `#${numericAircraftId}`}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Rows3 className="h-4 w-4" />
            Cabin Class
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-semibold">{cabinClass.name}</span>
            <Badge variant="outline">{cabinClass.code}</Badge>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Seat Map Status</div>
          <div className="mt-1 font-semibold">{existingSeatMapId ? "Already configured" : "Not configured"}</div>
        </div>
      </div>

      {existingSeatMapId ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">This cabin already has a seat map</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Seat-service supports one active seat map per cabin class. View or edit the existing map instead of creating a duplicate.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/airline/aircraft/${numericAircraftId}/cabin/${numericCabinId}/seat-map/${existingSeatMapId}`)}
              >
                View
              </Button>
              <Button
                onClick={() => navigate(`/airline/aircraft/${numericAircraftId}/cabin/${numericCabinId}/seat-map/${existingSeatMapId}/edit`)}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <SeatMapForm
          isEdit={false}
          cabinClassId={numericCabinId}
          cabinClass={cabinClass}
          onSuccess={handleSuccess}
          onCancel={goBackToAircraft}
        />
      )}
    </div>
  );
};

export default SeatMapCreate;
