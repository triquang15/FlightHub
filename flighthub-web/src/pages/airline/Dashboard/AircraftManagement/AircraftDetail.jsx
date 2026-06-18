import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Grid3X3, Plus } from "lucide-react";

import AircraftHeader from "@/components/aircraft/AircraftHeader";
import CabinCard from "@/components/aircraft/CabinCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Loader } from "@/components/common/Loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAircraftById } from "@/Redux/aircraft/aircraftThunks";
import { getCabinClassesByAircraft } from "@/Redux/cabinClass/cabinClassThunk";

const AircraftDetail = () => {
  const { aircraftId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentAircraft, loading: aircraftLoading, error: aircraftError } = useSelector((state) => state.aircraft);
  const { cabinClasses: cabinPayload = [], loading: cabinLoading, error: cabinError } = useSelector((state) => state.cabinClass);
  const cabinClasses = Array.isArray(cabinPayload) ? cabinPayload : (cabinPayload?.data || []);
  const aircraftMatchesRoute = String(currentAircraft?.id) === String(aircraftId);

  useEffect(() => {
    if (!aircraftId) return;
    dispatch(getAircraftById(aircraftId));
    dispatch(getCabinClassesByAircraft(aircraftId));
  }, [aircraftId, dispatch]);

  if (aircraftLoading && !aircraftMatchesRoute) return <Loader message="Loading aircraft details..." />;

  if (!aircraftMatchesRoute) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={AlertCircle}
            title="Aircraft not found"
            description={aircraftError || "The requested aircraft is unavailable or does not belong to this airline."}
            action={() => navigate("/airline/aircraft")}
            actionText="Back to fleet"
          />
        </CardContent>
      </Card>
    );
  }

  const createCabin = () => navigate(`/airline/aircraft/${aircraftId}/cabin/new`);

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate("/airline/aircraft")}>
        <ArrowLeft /> Back to fleet
      </Button>

      <AircraftHeader
        aircraft={currentAircraft}
        cabinCount={cabinClasses.length}
        onEdit={() => navigate(`/airline/aircraft/${aircraftId}/edit`)}
      />

      {cabinError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{cabinError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="border-b sm:grid-cols-[1fr_auto]">
          <div>
            <CardTitle className="flex items-center gap-2"><Grid3X3 className="h-4 w-4" /> Cabin configuration</CardTitle>
            <CardDescription>Manage cabin classes and their seat maps for this aircraft.</CardDescription>
          </div>
          <Button size="sm" onClick={createCabin}><Plus /> Add cabin</Button>
        </CardHeader>
        <CardContent>
          {cabinLoading ? (
            <Loader message="Loading cabin configuration..." />
          ) : cabinClasses.length === 0 ? (
            <EmptyState
              icon={Grid3X3}
              title="No cabins configured"
              description="Add the first cabin class before this aircraft can be prepared for inventory."
              action={createCabin}
              actionText="Add first cabin"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cabinClasses.map((cabin) => (
                <CabinCard
                  key={cabin.id}
                  cabin={cabin}
                  onViewSeatmap={(item) => navigate(`/airline/aircraft/${aircraftId}/cabin/${item.id}/seat-map/${item.seatMapId || item.seatMap?.id}`)}
                  onEdit={(item) => navigate(`/airline/aircraft/${aircraftId}/cabin/${item.id}/edit`)}
                  onCreateSeatMap={(item) => navigate(`/airline/aircraft/${aircraftId}/cabin/${item.id}/seat-map/create`)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AircraftDetail;
