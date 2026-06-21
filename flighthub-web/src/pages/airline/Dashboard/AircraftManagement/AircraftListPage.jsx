import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteAircraft, getAircraftFleetSummary } from '@/Redux/aircraft/aircraftThunks';
import AircraftTable from '@/components/aircraft/AircraftTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Plane } from 'lucide-react';
import { toast } from 'sonner';

const AircraftListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fleetSummary = useSelector((state) => state.aircraft.fleetSummary);

  useEffect(() => {
    dispatch(getAircraftFleetSummary());
  }, [dispatch]);

  const handleViewDetails = (aircraft) => {
    navigate(`/airline/aircraft/${aircraft.id}`);
  };

  const handleEdit = (aircraft) => {
    navigate(`/airline/aircraft/${aircraft.id}/edit`);
  };

  const handleDelete = async (aircraft) => {
    try {
      await dispatch(deleteAircraft(aircraft.id)).unwrap();
      await dispatch(getAircraftFleetSummary()).unwrap();
      toast.success(`${aircraft.code || 'Aircraft'} deleted successfully`);
    } catch (error) {
      toast.error(error || 'Unable to delete aircraft');
    }
  };

  const handleCreateAircraft = () => {
    navigate('/airline/aircraft/new');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Plane className="h-8 w-8 mr-3" />
            Aircraft Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your airline's fleet of aircraft, cabin configurations, and seat layouts
          </p>
        </div>

        <Button onClick={handleCreateAircraft} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Add New Aircraft
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {fleetSummary.totalAircraft.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Aircraft</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {fleetSummary.activeAircraft.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {fleetSummary.maintenanceAircraft.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Maintenance</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {fleetSummary.totalSeats.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Seats</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aircraft Table */}
      <AircraftTable
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default AircraftListPage;
