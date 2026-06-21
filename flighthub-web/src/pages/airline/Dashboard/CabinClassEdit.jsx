import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Layers3 } from 'lucide-react';

import CabinClassForm from '@/components/cabinClass/CabinClassForm';
import { Button } from '@/components/ui/button';

const CabinClassEdit = () => {
  const { aircraftId, cabinId } = useParams();
  const navigate = useNavigate();

  const numericAircraftId = useMemo(() => Number.parseInt(aircraftId, 10), [aircraftId]);
  const numericCabinId = useMemo(() => Number.parseInt(cabinId, 10), [cabinId]);
  const hasValidParams =
    Number.isInteger(numericAircraftId) &&
    numericAircraftId > 0 &&
    Number.isInteger(numericCabinId) &&
    numericCabinId > 0;

  const goBackToAircraft = () => {
    navigate(Number.isInteger(numericAircraftId) ? `/airline/aircraft/${numericAircraftId}` : '/airline/aircraft');
  };

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-hidden">
      <div className="flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Layers3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
              <span>Aircraft</span>
              <span>/</span>
              <span>{Number.isInteger(numericAircraftId) ? `#${numericAircraftId}` : 'Invalid aircraft'}</span>
              <span>/</span>
              <span>{Number.isInteger(numericCabinId) ? `Cabin #${numericCabinId}` : 'Invalid cabin'}</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              Edit Cabin Class
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Update the cabin product used by seat maps, fares, and flight inventory.
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={goBackToAircraft} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
          Back to Aircraft
        </Button>
      </div>

      {!hasValidParams ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          Aircraft id or cabin id is missing. Open this page from a valid aircraft detail screen.
        </div>
      ) : (
        <CabinClassForm
          isEdit
          cabinClassId={numericCabinId}
          aircraftId={numericAircraftId}
          onSuccess={goBackToAircraft}
          onCancel={goBackToAircraft}
          onDelete={goBackToAircraft}
        />
      )}
    </div>
  );
};

export default CabinClassEdit;
