import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader } from '@/components/common/Loader';
import { createAircraft, getAircraftById, updateAircraft } from '@/Redux/aircraft/aircraftThunks';
import { getAirlineByAdmin } from '@/Redux/airline/airlineThunks';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// AircraftStatus enum values from the DTO
const AIRCRAFT_STATUS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'RETIRED', label: 'Retired' },
];

const getEmptyFormData = (airlineId = null) => ({
  code: '',
  model: '',
  manufacturer: '',
  seatingCapacity: '',
  economySeats: '',
  premiumEconomySeats: 0,
  businessSeats: 0,
  firstClassSeats: 0,
  rangeKm: '',
  cruisingSpeedKmh: '',
  maxAltitudeFt: '',
  yearOfManufacture: '',
  registrationDate: null,
  nextMaintenanceDate: null,
  status: 'ACTIVE',
  isAvailable: true,
  airlineId,
  currentAirportId: null,
});

const toOptionalPositiveNumber = (value) =>
  value === '' || value === null || value === undefined ? null : Number(value);

const toRequiredNumber = (value) =>
  value === '' || value === null || value === undefined ? 0 : Number(value);

const formatDisplayDate = (date) =>
  date
    ? date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

const formatApiDate = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DateField = ({ id, label, value, onChange, placeholder = 'Select date' }) => {
  const [open, setOpen] = useState(false);

  const selectDate = (date) => {
    onChange(date || null);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-11 w-full justify-between rounded-md border-border/70 bg-background/60 px-3 text-left font-normal shadow-sm hover:bg-accent hover:text-accent-foreground",
              !value && "text-muted-foreground",
            )}
          >
            <span>{value ? formatDisplayDate(value) : placeholder}</span>
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <CalendarComponent
            mode="single"
            selected={value || undefined}
            onSelect={selectDate}
            initialFocus
          />
          <div className="flex items-center justify-between border-t border-border/70 bg-popover px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => selectDate(null)}
              className="h-8 gap-2 px-2 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => selectDate(new Date())}
              className="h-8 px-3"
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const AircraftForm = ({ 
  onCancel, 
  isEditMode = false, 
  aircraftData = null,
  loading = false,
  error = null
}) => {
  const [formData, setFormData] = useState(getEmptyFormData());
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { aircraftId } = useParams();
  const routeEditMode = Boolean(aircraftId);
  const effectiveEditMode = isEditMode || routeEditMode;
  const { currentAirline, airlines = [] } = useSelector((state) => state.airline || {});
  const {
    currentAircraft,
    createLoading = false,
    updateLoading = false,
    error: aircraftError = null,
  } = useSelector((state) => state.aircraft || {});
  const routeAircraft = String(currentAircraft?.id) === String(aircraftId) ? currentAircraft : null;
  const effectiveAircraftData = aircraftData || (routeEditMode ? routeAircraft : null);
  const saving = loading || createLoading || updateLoading;
  const airlineOptions = currentAirline
    ? [currentAirline, ...airlines.filter((airline) => airline.id !== currentAirline.id)]
    : airlines;

  const [errors, setErrors] = useState({});

  // Initialize form with data when editing
  useEffect(() => {
    dispatch(getAirlineByAdmin());
  }, [dispatch]);

  useEffect(() => {
    if (routeEditMode) {
      dispatch(getAircraftById(aircraftId));
    }
  }, [aircraftId, dispatch, routeEditMode]);

  useEffect(() => {
    const airlineId = currentAirline?.id || (airlines.length === 1 ? airlines[0].id : null);
    if (!effectiveEditMode && airlineId && !formData.airlineId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({ ...prev, airlineId }));
    }
  }, [airlines, currentAirline, effectiveEditMode, formData.airlineId]);

  // Initialize form with data when editing
  useEffect(() => {
    if (effectiveEditMode && effectiveAircraftData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        code: effectiveAircraftData.code || '',
        model: effectiveAircraftData.model || '',
        manufacturer: effectiveAircraftData.manufacturer || '',
        seatingCapacity: effectiveAircraftData.seatingCapacity || '',
        economySeats: effectiveAircraftData.economySeats || '',
        premiumEconomySeats: effectiveAircraftData.premiumEconomySeats || 0,
        businessSeats: effectiveAircraftData.businessSeats || 0,
        firstClassSeats: effectiveAircraftData.firstClassSeats || 0,
        rangeKm: effectiveAircraftData.rangeKm || '',
        cruisingSpeedKmh: effectiveAircraftData.cruisingSpeedKmh || '',
        maxAltitudeFt: effectiveAircraftData.maxAltitudeFt || '',
        yearOfManufacture: effectiveAircraftData.yearOfManufacture || '',
        registrationDate: effectiveAircraftData.registrationDate ? new Date(effectiveAircraftData.registrationDate) : null,
        nextMaintenanceDate: effectiveAircraftData.nextMaintenanceDate ? new Date(effectiveAircraftData.nextMaintenanceDate) : null,
        status: effectiveAircraftData.status || 'ACTIVE',
        isAvailable: effectiveAircraftData.isAvailable !== undefined ? effectiveAircraftData.isAvailable : true,
        airlineId: effectiveAircraftData.airlineId || currentAirline?.id || null,
        currentAirportId: effectiveAircraftData.currentAirportId || null,
      });
    } else {
      // Reset form when not editing
      const airlineId = currentAirline?.id || (airlines.length === 1 ? airlines[0].id : null);
      setFormData(getEmptyFormData(airlineId));
    }
    // Clear errors when form data changes
    setErrors({});
  }, [airlines, currentAirline?.id, effectiveAircraftData, effectiveEditMode]);

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    const seatingCapacity = toRequiredNumber(formData.seatingCapacity);
    const economySeats = toRequiredNumber(formData.economySeats);
    const premiumEconomySeats = toRequiredNumber(formData.premiumEconomySeats);
    const businessSeats = toRequiredNumber(formData.businessSeats);
    const firstClassSeats = toRequiredNumber(formData.firstClassSeats);
    const rangeKm = toOptionalPositiveNumber(formData.rangeKm);
    const cruisingSpeedKmh = toOptionalPositiveNumber(formData.cruisingSpeedKmh);
    const maxAltitudeFt = toOptionalPositiveNumber(formData.maxAltitudeFt);
    const yearOfManufacture = toRequiredNumber(formData.yearOfManufacture);
    
    if (!formData.code.trim()) {
      newErrors.code = 'Aircraft code is required';
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Aircraft model is required';
    }
    
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    
    if (!seatingCapacity || seatingCapacity <= 0) {
      newErrors.seatingCapacity = 'Seating capacity must be positive';
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (!formData.airlineId) {
      newErrors.airlineId = 'Airline is required';
    }
    
    if (economySeats <= 0) {
      newErrors.economySeats = 'Economy seats must be positive';
    }
    
    if (yearOfManufacture < 1950 || yearOfManufacture > new Date().getFullYear()) {
      newErrors.yearOfManufacture = 'Year must be between 1950 and the current year';
    }

    if (rangeKm !== null && rangeKm <= 0) {
      newErrors.rangeKm = 'Range must be positive';
    }

    if (cruisingSpeedKmh !== null && cruisingSpeedKmh <= 0) {
      newErrors.cruisingSpeedKmh = 'Cruising speed must be positive';
    }

    if (maxAltitudeFt !== null && maxAltitudeFt <= 0) {
      newErrors.maxAltitudeFt = 'Maximum altitude must be positive';
    }
    
    // Calculate total seats from class seats
    const totalClassSeats =
      economySeats +
      premiumEconomySeats +
      businessSeats +
      firstClassSeats;
    
    if (totalClassSeats !== seatingCapacity) {
      newErrors.seatingCapacity = `Total seating capacity (${seatingCapacity}) must match sum of class seats (${totalClassSeats})`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };



  // Handle form submission
  const handleSubmit = async(e) => {
    e.preventDefault();
    if (validateForm()) {
          const requestData = {
            ...formData,
            seatingCapacity: toRequiredNumber(formData.seatingCapacity),
            economySeats: toRequiredNumber(formData.economySeats),
            premiumEconomySeats: toRequiredNumber(formData.premiumEconomySeats),
            businessSeats: toRequiredNumber(formData.businessSeats),
            firstClassSeats: toRequiredNumber(formData.firstClassSeats),
            rangeKm: toOptionalPositiveNumber(formData.rangeKm),
            cruisingSpeedKmh: toOptionalPositiveNumber(formData.cruisingSpeedKmh),
            maxAltitudeFt: toOptionalPositiveNumber(formData.maxAltitudeFt),
            yearOfManufacture: toRequiredNumber(formData.yearOfManufacture),
            registrationDate: formatApiDate(formData.registrationDate),
            nextMaintenanceDate: formatApiDate(formData.nextMaintenanceDate),
          };

          try {
            if (effectiveEditMode) {
              await dispatch(updateAircraft({ aircraftId, aircraftData: requestData })).unwrap();
              toast.success("Aircraft updated successfully");
              navigate(`/airline/aircraft/${aircraftId}`);
            } else {
              await dispatch(createAircraft(requestData)).unwrap();
              toast.success("Aircraft created successfully");
              navigate('/airline/aircraft');
            }
          } catch (error) {
            console.error("Error creating aircraft:", error);
            toast.error(error || "Unable to save aircraft");
          }
        
    }
    
  };

  if (effectiveEditMode && !effectiveAircraftData) {
    return <Loader message="Loading aircraft form..." />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl rounded-md border bg-card">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">{effectiveEditMode ? 'Edit Aircraft' : 'Create New Aircraft'}</h2>
      </div>
      <div className="p-6">
        {(error || aircraftError) && (
          <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-md mb-6">
            {error || aircraftError}
          </div>
        )}
        
        <ScrollArea className="h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="airlineId">Airline</Label>
                  <div className="border rounded-md p-2">
                    <select
                      id="airlineId"
                      name="airlineId"
                      className="w-full bg-transparent outline-none"
                      value={formData.airlineId || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        airlineId: e.target.value ? Number(e.target.value) : null
                      }))}
                    >
                      <option value="">Select airline</option>
                      {airlineOptions.map((airline) => (
                        <option key={airline.id} value={airline.id}>
                          {airline.name} ({airline.iataCode || airline.icaoCode || airline.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.airlineId && (
                    <p className="text-sm text-red-500">{errors.airlineId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Aircraft Code</Label>
                  <Input
                    className="w-full"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g. A001"
                    required
                  />
                  {errors.code && (
                    <p className="text-sm text-red-500">{errors.code}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model">Aircraft Model</Label>
                  <Input
                    className="w-full"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g. Boeing 737-800"
                    required
                  />
                  {errors.model && (
                    <p className="text-sm text-red-500">{errors.model}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    className="w-full"
                    id="manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    placeholder="e.g. Boeing"
                    required
                  />
                  {errors.manufacturer && (
                    <p className="text-sm text-red-500">{errors.manufacturer}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yearOfManufacture">Year of Manufacture</Label>
                  <Input
                    className="w-full"
                    id="yearOfManufacture"
                    name="yearOfManufacture"
                    type="number"
                    value={formData.yearOfManufacture}
                    onChange={handleChange}
                    placeholder="2020"
                    min="1950"
                    max={new Date().getFullYear()}
                    required
                  />
                  {errors.yearOfManufacture && (
                    <p className="text-sm text-red-500">{errors.yearOfManufacture}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Seating Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Seating Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seatingCapacity">Total Seating Capacity</Label>
                  <Input
                    className="w-full"
                    id="seatingCapacity"
                    name="seatingCapacity"
                    type="number"
                    value={formData.seatingCapacity}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                  {errors.seatingCapacity && (
                    <p className="text-sm text-red-500">{errors.seatingCapacity}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="economySeats">Economy Seats</Label>
                  <Input
                    className="w-full"
                    id="economySeats"
                    name="economySeats"
                    type="number"
                    value={formData.economySeats}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                  {errors.economySeats && (
                    <p className="text-sm text-red-500">{errors.economySeats}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="premiumEconomySeats">Premium Economy Seats</Label>
                  <Input
                    className="w-full"
                    id="premiumEconomySeats"
                    name="premiumEconomySeats"
                    type="number"
                    value={formData.premiumEconomySeats}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessSeats">Business Seats</Label>
                  <Input
                    className="w-full"
                    id="businessSeats"
                    name="businessSeats"
                    type="number"
                    value={formData.businessSeats}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="firstClassSeats">First Class Seats</Label>
                  <Input
                    className="w-full"
                    id="firstClassSeats"
                    name="firstClassSeats"
                    type="number"
                    value={formData.firstClassSeats}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Performance Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rangeKm">Range (km)</Label>
                  <Input
                    className="w-full"
                    id="rangeKm"
                    name="rangeKm"
                    type="number"
                    value={formData.rangeKm}
                    onChange={handleChange}
                    min="1"
                  />
                  {errors.rangeKm && (
                    <p className="text-sm text-red-500">{errors.rangeKm}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cruisingSpeedKmh">Cruising Speed (km/h)</Label>
                  <Input
                    className="w-full"
                    id="cruisingSpeedKmh"
                    name="cruisingSpeedKmh"
                    type="number"
                    value={formData.cruisingSpeedKmh}
                    onChange={handleChange}
                    min="1"
                  />
                  {errors.cruisingSpeedKmh && (
                    <p className="text-sm text-red-500">{errors.cruisingSpeedKmh}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxAltitudeFt">Max Altitude (ft)</Label>
                  <Input
                    className="w-full"
                    id="maxAltitudeFt"
                    name="maxAltitudeFt"
                    type="number"
                    value={formData.maxAltitudeFt}
                    onChange={handleChange}
                    min="1"
                  />
                  {errors.maxAltitudeFt && (
                    <p className="text-sm text-red-500">{errors.maxAltitudeFt}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status and Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status and Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <div className="border rounded-md p-2">
                    <select 
                      id="status"
                      name="status"
                      className="w-full bg-transparent outline-none"
                      value={formData.status}
                      onChange={(e) => handleSelectChange('status', e.target.value)}
                    >
                      <option value="">Select status</option>
                      {AIRCRAFT_STATUS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.status && (
                    <p className="text-sm text-red-500">{errors.status}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="isAvailable" 
                      checked={formData.isAvailable} 
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                    />
                    <Label htmlFor="isAvailable">Is Available</Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <DateField
                    id="registrationDate"
                    label="Registration Date"
                    value={formData.registrationDate}
                    onChange={(date) => handleDateChange('registrationDate', date)}
                    placeholder="Select registration date"
                  />
                </div>
                
                <div className="space-y-2">
                  <DateField
                    id="nextMaintenanceDate"
                    label="Next Maintenance Date"
                    value={formData.nextMaintenanceDate}
                    onChange={(date) => handleDateChange('nextMaintenanceDate', date)}
                    placeholder="Select maintenance date"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="currentAirportId">Current Airport ID</Label>
                <Input
                  className="w-full"
                  id="currentAirportId"
                  name="currentAirportId"
                  type="number"
                  value={formData.currentAirportId || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    currentAirportId: e.target.value ? parseInt(e.target.value) : null
                  }))}
                  placeholder="Leave blank if not assigned"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel || (() => navigate(effectiveEditMode ? `/airline/aircraft/${aircraftId}` : '/airline/aircraft'))}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : effectiveEditMode ? 'Update Aircraft' : 'Create Aircraft'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AircraftForm;
