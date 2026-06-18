import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  ArrowLeft,
  Save,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plane,
  CalendarDays,
  Settings,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  createFlightInstance,
  updateFlightInstance,
  getFlightInstanceById,
} from "@/Redux/flightInstance/flightInstanceThunk";
import { getAllFlightSchedules } from "@/Redux/flightSchedule/flightScheduleThunk";
import { getFlightsByAirline } from "@/Redux/flight/flightThunk";
import { listAllAirports } from "@/Redux/airport/airportThunk";
import { toLocalDateTimePayload } from "@/utils/flightOps";

const VALID_TIME_PATTERN = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const formatDateTimeLocal = (date) => format(date, "yyyy-MM-dd'T'HH:mm"); // local datetime string

const roundUpToNextQuarterHour = (date = new Date()) => {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  const nextQuarter = Math.ceil((minutes + 1) / 15) * 15;
  rounded.setMinutes(nextQuarter);
  return rounded;
};

const parseTimeParts = (timeValue) => {
  if (!VALID_TIME_PATTERN.test(timeValue || "")) return null;
  const [hours, minutes] = timeValue.split(":").map(Number);
  return { hours, minutes };
};

const setTimeOnDate = (date, timeValue) => {
  const parts = parseTimeParts(timeValue);
  const updated = new Date(date);

  if (parts) {
    updated.setHours(parts.hours, parts.minutes, 0, 0);
  }

  return updated;
};

const addMinutes = (date, minutes) => {
  const updated = new Date(date);
  updated.setMinutes(updated.getMinutes() + minutes);
  return updated;
};

const getScheduleTime = (schedule, field) =>
  typeof schedule?.[field] === "string" ? schedule[field].slice(0, 5) : "";

const normalizeOperatingDay = (date) =>
  date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

const isScheduleOperatingOn = (schedule, date) => {
  const days = asArray(schedule?.operatingDays);
  if (!days.length) return true;
  return days.includes(normalizeOperatingDay(date));
};

const isWithinScheduleWindow = (schedule, date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  if (schedule?.startDate) {
    const start = new Date(schedule.startDate);
    start.setHours(0, 0, 0, 0);
    if (day < start) return false;
  }

  if (schedule?.endDate) {
    const end = new Date(schedule.endDate);
    end.setHours(23, 59, 59, 999);
    if (day > end) return false;
  }

  return true;
};

const getNextDepartureFromSchedule = (schedule) => {
  const departureTime = getScheduleTime(schedule, "departureTime");
  const now = new Date();
  let candidate = schedule?.startDate ? new Date(schedule.startDate) : new Date();
  candidate.setHours(0, 0, 0, 0);

  if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    candidate = new Date(now);
    candidate.setHours(0, 0, 0, 0);
  }

  for (let i = 0; i < 370; i += 1) {
    if (isWithinScheduleWindow(schedule, candidate) && isScheduleOperatingOn(schedule, candidate)) {
      const departure = departureTime
        ? setTimeOnDate(candidate, departureTime)
        : roundUpToNextQuarterHour(now);

      if (departure > now) return departure;
    }

    candidate.setDate(candidate.getDate() + 1);
  }

  return roundUpToNextQuarterHour(now);
};

const getArrivalFromDeparture = (departure, schedule, previousArrival, previousDeparture) => {
  const scheduleArrivalTime = getScheduleTime(schedule, "arrivalTime");

  if (scheduleArrivalTime) {
    const arrival = setTimeOnDate(departure, scheduleArrivalTime);
    if (arrival <= departure) arrival.setDate(arrival.getDate() + 1);
    return arrival;
  }

  if (previousArrival && previousDeparture) {
    const durationMinutes = Math.max(
      30,
      Math.round((new Date(previousArrival) - new Date(previousDeparture)) / 60000)
    );
    return addMinutes(departure, durationMinutes);
  }

  return addMinutes(departure, 120);
};

const ensureFutureDeparture = (departure) => {
  const now = new Date();
  if (departure > now) return departure;
  return roundUpToNextQuarterHour(now);
};

// Validation schema for create mode
const createFlightInstanceSchema = Yup.object().shape({
  scheduleId: Yup.string().required("Flight schedule is required"),
  flightId: Yup.string().required("Flight is required"),
  departureAirportId: Yup.string().required("Departure airport is required"),
  arrivalAirportId: Yup.string()
    .required("Arrival airport is required")
    .test(
      "different-airports",
      "Arrival airport must be different from departure airport",
      function (value) {
        return value !== this.parent.departureAirportId;
      }
    ),
  departureDateTime: Yup.date()
    .required("Departure date and time is required")
    .test(
      "future-departure",
      "Choose a future departure time",
      (value) => !value || new Date(value) > new Date()
    ),
  arrivalDateTime: Yup.date()
    .required("Arrival date and time is required")
    .test(
      "arrival-after-departure",
      "Arrival must be after departure",
      function (value) {
        return (
          !this.parent.departureDateTime ||
          !value ||
          value > this.parent.departureDateTime
        );
      }
    ),
});

// Validation schema for edit mode - only status and times can be updated
const editFlightInstanceSchema = Yup.object().shape({
  departureDateTime: Yup.date()
    .required("Departure date and time is required")
    .typeError("Please enter a valid date and time"),
  arrivalDateTime: Yup.date()
    .required("Arrival date and time is required")
    .typeError("Please enter a valid date and time")
    .test(
      "arrival-after-departure",
      "Arrival time must be after departure time",
      function (value) {
        return (
          !this.parent.departureDateTime ||
          !value ||
          new Date(value) > new Date(this.parent.departureDateTime)
        );
      }
    ),
});

const statusOptions = [
  {
    value: "SCHEDULED",
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800",
  },
  { value: "BOARDING", label: "Boarding", color: "bg-cyan-100 text-cyan-800" },
  { value: "DEPARTED", label: "Departed", color: "bg-violet-100 text-violet-800" },
  { value: "ARRIVED", label: "Arrived", color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const mergeById = (...lists) => {
  const byId = new Map();

  lists.flat().forEach((item) => {
    if (!item?.id) return;
    byId.set(String(item.id), { ...byId.get(String(item.id)), ...item });
  });

  return Array.from(byId.values());
};

const getAirportLabel = (airport) => {
  if (!airport) return "Airport unavailable";

  const code = airport.iataCode || airport.code || `Airport ${airport.id}`;
  const city = airport.city?.name || airport.cityName;
  const name = airport.name || airport.airportName || city || "Airport";

  return `${code} - ${name}`;
};

const getFlightRouteIds = (flight) => ({
  departureAirportId: flight?.departureAirport?.id,
  arrivalAirportId: flight?.arrivalAirport?.id,
});

const FlightInstanceForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { airports } = useSelector((state) => state.airport);

  const { flights } = useSelector(
    (state) => state.flight
  );
  const { flightSchedules: schedules,} = useSelector(
    (state) => state.flightSchedule || {}
  );
  const { loading: instanceLoading } = useSelector(
    (state) => state.flightInstance || {}
  );

  const flightOptions = asArray(flights);
  const scheduleOptions = asArray(schedules);
  const scheduleAirports = scheduleOptions.flatMap((schedule) => [
    schedule.departureAirport,
    schedule.arrivalAirport,
  ]);
  const airportOptions = mergeById(asArray(airports), scheduleAirports);

  const [initialValues, setInitialValues] = useState({
    scheduleId: "",
    flightId: "",
    departureAirportId: "",
    arrivalAirportId: "",
    departureDateTime: "",
    arrivalDateTime: "",

    status: "SCHEDULED",
  });

  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");

  // Fetch required data on component mount
  useEffect(() => {
    dispatch(getFlightsByAirline());
    dispatch(getAllFlightSchedules());

    if (isEditMode) {
      dispatch(getFlightInstanceById(id)).then((result) => {
        if (result.payload) {
          const instance = result.payload;
          setInitialValues({
            scheduleId: instance.scheduleId ? String(instance.scheduleId) : "",
            flightId: instance.flightId ? String(instance.flightId) : "",
            departureAirportId: instance.departureAirport?.id
              ? String(instance.departureAirport.id)
              : "",
            arrivalAirportId: instance.arrivalAirport?.id
              ? String(instance.arrivalAirport.id)
              : "",
            departureDateTime: instance.departureDateTime
              ? formatDateTimeLocal(new Date(instance.departureDateTime))
              : "",
            arrivalDateTime: instance.arrivalDateTime
              ? formatDateTimeLocal(new Date(instance.arrivalDateTime))
              : "",

            status: instance.status || "SCHEDULED",
          });
          if (instance.departureDateTime) {
            setDepartureTime(
              formatDateTimeLocal(new Date(instance.departureDateTime)).slice(11, 16)
            );
          }
          if (instance.arrivalDateTime) {
            setArrivalTime(
              formatDateTimeLocal(new Date(instance.arrivalDateTime)).slice(11, 16)
            );
          }
        }
      });
    }
  }, [dispatch, id, isEditMode]);

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const selectedFlight = getSelectedFlight(values.flightId);
      const routeIds = getFlightRouteIds(selectedFlight);
      const totalSeats =
        selectedFlight?.aircraft?.totalSeats ||
        selectedFlight?.aircraft?.seatingCapacity ||
        selectedFlight?.totalSeats;

      if (!routeIds.departureAirportId || !routeIds.arrivalAirportId) {
        setFieldError(
          "submit",
          "Selected flight is missing route data. Please refresh flights or choose another flight."
        );
        return;
      }

      let formData = {
        ...values,
        scheduleId: Number(values.scheduleId),
        flightId: Number(values.flightId),
        departureAirportId: Number(routeIds.departureAirportId),
        arrivalAirportId: Number(routeIds.arrivalAirportId),
        departureDateTime: toLocalDateTimePayload(values.departureDateTime),
        arrivalDateTime: toLocalDateTimePayload(values.arrivalDateTime),
        totalSeats,
      };

      // In edit mode, only send editable fields
      if (isEditMode) {
        formData = {
          flightId: Number(values.flightId),
          departureAirportId: Number(routeIds.departureAirportId),
          arrivalAirportId: Number(routeIds.arrivalAirportId),
          departureDateTime: formData.departureDateTime,
          arrivalDateTime: formData.arrivalDateTime,
          totalSeats,
        };
      }

      let result;
      if (isEditMode) {
        result = await dispatch(updateFlightInstance({ id, data: formData }));
      } else {
        result = await dispatch(createFlightInstance(formData));
      }

      if (result.type.endsWith("/fulfilled")) {
        navigate("/airline/instances");
      } else {
        // Handle API errors
        const errorMessage =
          typeof result.payload === "string"
            ? result.payload
            : result.payload?.message || "An error occurred";
        setFieldError("submit", errorMessage);
      }
    } catch (error) {
      setFieldError("submit", error?.message || "Unable to save flight instance");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    dispatch(
      listAllAirports({
        page: 0,
        size: 500,
        sortBy: "iataCode",
        sortDirection: "asc",
      })
    );
  }, [dispatch]);

  const getSelectedFlight = (flightId) => {
    return flightOptions.find((flight) => String(flight.id) === String(flightId));
  };

  const getSelectedSchedule = (scheduleId) => {
    return scheduleOptions.find(
      (schedule) => String(schedule.id) === String(scheduleId)
    );
  };

  const applyDateTimePair = (setFieldValue, departure, arrival) => {
    setDepartureTime(format(departure, "HH:mm"));
    setArrivalTime(format(arrival, "HH:mm"));
    setFieldValue("departureDateTime", formatDateTimeLocal(departure));
    setFieldValue("arrivalDateTime", formatDateTimeLocal(arrival));
  };

  const updateDepartureDateTime = (setFieldValue, departure, values, schedule) => {
    const safeDeparture = ensureFutureDeparture(departure);
    const arrival = getArrivalFromDeparture(
      safeDeparture,
      schedule,
      values.arrivalDateTime,
      values.departureDateTime
    );
    applyDateTimePair(setFieldValue, safeDeparture, arrival);
  };

  const handleScheduleChange = (scheduleId, setFieldValue) => {
    const schedule = getSelectedSchedule(scheduleId);
    if (schedule) {
      setFieldValue("flightId", schedule.flightId ? String(schedule.flightId) : "");
      setFieldValue(
        "departureAirportId",
        schedule.departureAirport?.id ? String(schedule.departureAirport.id) : ""
      );
      setFieldValue(
        "arrivalAirportId",
        schedule.arrivalAirport?.id ? String(schedule.arrivalAirport.id) : ""
      );

      const departure = getNextDepartureFromSchedule(schedule);
      const arrival = getArrivalFromDeparture(departure, schedule);
      applyDateTimePair(setFieldValue, departure, arrival);
    }
  };

  const handleFlightChange = (flightId, setFieldValue) => {
    const flight = getSelectedFlight(flightId);
    const routeIds = getFlightRouteIds(flight);

    setFieldValue("flightId", flightId);
    setFieldValue(
      "departureAirportId",
      routeIds.departureAirportId ? String(routeIds.departureAirportId) : ""
    );
    setFieldValue(
      "arrivalAirportId",
      routeIds.arrivalAirportId ? String(routeIds.arrivalAirportId) : ""
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/airline/instances")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Instances
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-primary" />
              {isEditMode ? "Edit Flight Instance" : "Create Flight Instance"}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? "Update existing flight instance"
                : "Create a specific flight instance from a schedule"}
            </p>
          </div>
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={
          isEditMode ? editFlightInstanceSchema : createFlightInstanceSchema
        }
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => (
          <Form className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Schedule and Flight Selection - Only show in create mode */}
                {!isEditMode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Schedule & Flight Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Schedule Selection */}
                      <div>
                        <Label htmlFor="scheduleId">Flight Schedule *</Label>
                        <Select
                          value={values.scheduleId}
                          onValueChange={(value) => {
                            setFieldValue("scheduleId", value);
                            handleScheduleChange(value, setFieldValue);
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              "mt-1 w-full",
                              errors.scheduleId &&
                                touched.scheduleId &&
                                "border-red-500"
                            )}
                          >
                            <SelectValue placeholder="Select a flight schedule" />
                          </SelectTrigger>
                          <SelectContent>
                            {scheduleOptions.map((schedule) => (
                              <SelectItem
                                key={schedule.id}
                                value={String(schedule.id)}
                              >
                                <p className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {schedule.flightNumber || "N/A"}
                                  </span>
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                  <span className="text-sm">
                                    {schedule.departureAirport?.city?.cityCode ||
                                      schedule.departureAirport?.iataCode ||
                                      "DEP"}{" "}
                                    →{" "}
                                    {schedule.arrivalAirport?.city?.cityCode ||
                                      schedule.arrivalAirport?.iataCode ||
                                      "ARR"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ({schedule.recurrenceType})
                                  </span>
                                </p>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ErrorMessage
                          name="scheduleId"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Flight Selection */}
                      <div>
                        <Label htmlFor="flightId">Flight *</Label>
                        <Select
                          value={values.flightId}
                          onValueChange={(value) =>
                            handleFlightChange(value, setFieldValue)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "mt-1 w-full",
                              errors.flightId &&
                                touched.flightId &&
                                "border-red-500"
                            )}
                          >
                            <SelectValue placeholder="Select a flight" />
                          </SelectTrigger>
                          <SelectContent>
                            {flightOptions.map((flight) => (
                              <SelectItem
                                key={flight.id}
                                value={String(flight.id)}
                              >
                                {flight.flightNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ErrorMessage
                          name="flightId"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Selected Schedule Info */}
                      {values.scheduleId && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-2">Schedule Details</h4>
                          {(() => {
                            const schedule = getSelectedSchedule(
                              values.scheduleId
                            );
                            return schedule ? (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    Recurrence:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {schedule.recurrenceType}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Schedule Time:
                                  </span>
                                  <span className="ml-2">
                                    {schedule.departureTime} -{" "}
                                    {schedule.arrivalTime}
                                  </span>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Flight Info - Show in edit mode as read-only */}
                {isEditMode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plane className="h-5 w-5" />
                        Flight Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Flight Number</Label>
                          <Input
                            value={
                              getSelectedFlight(values.flightId)
                                ?.flightNumber || "N/A"
                            }
                            disabled
                            className="mt-1 bg-muted"
                          />
                        </div>
                        <div>
                          <Label>Aircraft Type</Label>
                          <Input
                            value={
                              getSelectedFlight(values.flightId)?.aircraft
                                ?.model || "N/A"
                            }
                            disabled
                            className="mt-1 bg-muted"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Route and Time */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {isEditMode ? "Flight Times" : "Route & Schedule"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Airport Selection - Only in create mode */}
                    {!isEditMode && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="departureAirportId">
                            Departure Airport *
                          </Label>
                          <Select
                            value={String(values.departureAirportId)}
                            disabled
                          >
                            <SelectTrigger
                              className={cn(
                                "mt-1 w-full",
                                errors.departureAirportId &&
                                  touched.departureAirportId &&
                                  "border-red-500"
                              )}
                            >
                              <SelectValue placeholder="Select departure" />
                            </SelectTrigger>
                            <SelectContent>
                              {airportOptions.map((airport) => (
                                <SelectItem
                                  key={airport.id}
                                  value={String(airport.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {airport.iataCode || airport.code}
                                    </span>
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                    <span className="text-sm">
                                      {airport.name || airport.city?.name || "Airport"}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <ErrorMessage
                            name="departureAirportId"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="arrivalAirportId">
                            Arrival Airport *
                          </Label>
                          <Select
                            value={String(values.arrivalAirportId)}
                            disabled
                          >
                            <SelectTrigger
                              className={cn(
                                "mt-1 w-full",
                                errors.arrivalAirportId &&
                                  touched.arrivalAirportId &&
                                  "border-red-500"
                              )}
                            >
                              <SelectValue placeholder="Select arrival" />
                            </SelectTrigger>
                            <SelectContent>
                              {airportOptions.map((airport) => (
                                <SelectItem
                                  key={airport.id}
                                  value={String(airport.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {airport.iataCode || airport.code}
                                    </span>
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                    <span className="text-sm">
                                      {airport.name || airport.city?.name || "Airport"}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <ErrorMessage
                            name="arrivalAirportId"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                      </div>
                    )}

                    {/* Airport Display - Read-only in edit mode */}
                    {isEditMode && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Departure Airport</Label>
                          <Input
                            value={
                              getAirportLabel(
                                airportOptions.find(
                                  (a) =>
                                    String(a.id) ===
                                    String(values.departureAirportId)
                                )
                              )
                            }
                            disabled
                            className="mt-1 bg-muted"
                          />
                        </div>
                        <div>
                          <Label>Arrival Airport</Label>
                          <Input
                            value={
                              getAirportLabel(
                                airportOptions.find(
                                  (a) =>
                                    String(a.id) ===
                                    String(values.arrivalAirportId)
                                )
                              )
                            }
                            disabled
                            className="mt-1 bg-muted"
                          />
                        </div>
                      </div>
                    )}

                    {/* Date Time Selection - Shadcn Date Picker with Time Input */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Departure Date & Time */}
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="h-4 w-4" />
                          Departure Date & Time *
                        </Label>

                        {/* Date Picker */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !values.departureDateTime &&
                                  "text-muted-foreground",
                                errors.departureDateTime &&
                                  touched.departureDateTime &&
                                  "border-red-500"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {values.departureDateTime
                                ? format(
                                    new Date(values.departureDateTime),
                                    "PPP"
                                  )
                                : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                values.departureDateTime
                                  ? new Date(values.departureDateTime)
                                  : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  const schedule = getSelectedSchedule(values.scheduleId);
                                  const scheduleDepartureTime = getScheduleTime(
                                    schedule,
                                    "departureTime"
                                  );
                                  const currentDeparture = values.departureDateTime
                                    ? new Date(values.departureDateTime)
                                    : roundUpToNextQuarterHour();
                                  const selectedDate = new Date(date);
                                  const departure = setTimeOnDate(
                                    selectedDate,
                                    scheduleDepartureTime ||
                                      format(currentDeparture, "HH:mm")
                                  );

                                  updateDepartureDateTime(
                                    setFieldValue,
                                    departure,
                                    values,
                                    schedule
                                  );
                                }
                              }}
                              disabled={
                                !isEditMode
                                  ? (date) =>
                                      date <
                                      new Date(new Date().setHours(0, 0, 0, 0))
                                  : undefined
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>

                        {/* Time Input */}
                        <div className="mt-2">
                          <Label
                            htmlFor="departureTime"
                            className="text-xs text-muted-foreground"
                          >
                            Time (HH:MM)
                          </Label>
                          <div className="relative mt-1">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              id="departureTime"
                              type="text"
                              placeholder="14:30"
                              maxLength={5}
                              value={departureTime}
                              onChange={(e) => {
                                let timeValue = e.target.value.replace(
                                  /[^\d:]/g,
                                  ""
                                );

                                // Auto-add colon after 2 digits
                                if (
                                  timeValue.length === 2 &&
                                  !timeValue.includes(":")
                                ) {
                                  timeValue = timeValue + ":";
                                }

                                // Always update local state so user sees what they type
                                setDepartureTime(timeValue);

                                // If complete and valid HH:MM → update Formik
                                if (
                                  VALID_TIME_PATTERN.test(timeValue)
                                ) {
                                  const schedule = getSelectedSchedule(values.scheduleId);
                                  const date = values.departureDateTime
                                    ? new Date(values.departureDateTime)
                                    : new Date();
                                  const departure = setTimeOnDate(date, timeValue);
                                  updateDepartureDateTime(
                                    setFieldValue,
                                    departure,
                                    values,
                                    schedule
                                  );
                                }
                              }}
                              onBlur={() => {
                                // If invalid on blur, snap back to the last valid Formik time or set a default
                                if (
                                  !VALID_TIME_PATTERN.test(departureTime)
                                ) {
                                  if (values.departureDateTime) {
                                    setDepartureTime(
                                      values.departureDateTime.slice(11, 16)
                                    );
                                  } else {
                                    const schedule = getSelectedSchedule(values.scheduleId);
                                    const departure = getNextDepartureFromSchedule(schedule);
                                    const arrival = getArrivalFromDeparture(departure, schedule);
                                    applyDateTimePair(setFieldValue, departure, arrival);
                                  }
                                }
                              }}
                              className={cn(
                                "pl-10",
                                errors.departureDateTime &&
                                  touched.departureDateTime &&
                                  "border-red-500"
                              )}
                            />
                          </div>
                        </div>

                        {/* Formatted Display */}
                        {values.departureDateTime && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(values.departureDateTime).toLocaleString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </div>
                        )}
                        <ErrorMessage
                          name="departureDateTime"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Arrival Date & Time */}
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="h-4 w-4" />
                          Arrival Date & Time *
                        </Label>

                        {/* Date Picker */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !values.arrivalDateTime &&
                                  "text-muted-foreground",
                                errors.arrivalDateTime &&
                                  touched.arrivalDateTime &&
                                  "border-red-500"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {values.arrivalDateTime
                                ? format(
                                    new Date(values.arrivalDateTime),
                                    "PPP"
                                  )
                                : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                values.arrivalDateTime
                                  ? new Date(values.arrivalDateTime)
                                  : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  const existingDate = values.arrivalDateTime
                                    ? new Date(values.arrivalDateTime)
                                    : new Date();
                                  const updated = new Date(date);
                                  updated.setHours(
                                    existingDate.getHours(),
                                    existingDate.getMinutes(),
                                    0,
                                    0
                                  );

                                  if (
                                    values.departureDateTime &&
                                    updated <= new Date(values.departureDateTime)
                                  ) {
                                    updated.setDate(updated.getDate() + 1);
                                  }

                                  setArrivalTime(format(updated, "HH:mm"));
                                  setFieldValue(
                                    "arrivalDateTime",
                                    formatDateTimeLocal(updated)
                                  );
                                }
                              }}
                              disabled={
                                !isEditMode
                                  ? (date) =>
                                      date <
                                      new Date(new Date().setHours(0, 0, 0, 0))
                                  : undefined
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>

                        {/* Time Input */}
                        <div className="mt-2">
                          <Label
                            htmlFor="arrivalTime"
                            className="text-xs text-muted-foreground"
                          >
                            Time (HH:MM)
                          </Label>
                          <div className="relative mt-1">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              id="arrivalTime"
                              type="text"
                              placeholder="18:30"
                              maxLength={5}
                              value={arrivalTime}
                              onChange={(e) => {
                                let timeValue = e.target.value.replace(
                                  /[^\d:]/g,
                                  ""
                                );

                                // Auto-add colon after 2 digits (HH → HH:)
                                if (
                                  timeValue.length === 2 &&
                                  !timeValue.includes(":")
                                ) {
                                  timeValue = timeValue + ":";
                                }

                                // Local state update for user typing
                                setArrivalTime(timeValue);

                                // If time fully valid → update Formik datetime field
                                if (
                                  VALID_TIME_PATTERN.test(timeValue)
                                ) {
                                  const date = values.arrivalDateTime
                                    ? new Date(values.arrivalDateTime)
                                    : new Date();

                                  const arrival = setTimeOnDate(date, timeValue);
                                  if (
                                    values.departureDateTime &&
                                    arrival <= new Date(values.departureDateTime)
                                  ) {
                                    arrival.setDate(arrival.getDate() + 1);
                                  }

                                  setFieldValue(
                                    "arrivalDateTime",
                                    formatDateTimeLocal(arrival)
                                  );
                                }
                              }}
                              onBlur={() => {
                                // Reset to valid Formik or default if invalid format on blur
                                if (
                                  !VALID_TIME_PATTERN.test(arrivalTime)
                                ) {
                                  if (values.arrivalDateTime) {
                                    setArrivalTime(
                                      values.arrivalDateTime.slice(11, 16)
                                    );
                                  } else {
                                    const schedule = getSelectedSchedule(values.scheduleId);
                                    const departure = values.departureDateTime
                                      ? new Date(values.departureDateTime)
                                      : getNextDepartureFromSchedule(schedule);
                                    const date = getArrivalFromDeparture(departure, schedule);
                                    setArrivalTime(format(date, "HH:mm"));
                                    setFieldValue(
                                      "arrivalDateTime",
                                      formatDateTimeLocal(date)
                                    );
                                  }
                                }
                              }}
                              className={cn(
                                "pl-10",
                                errors.arrivalDateTime &&
                                  touched.arrivalDateTime &&
                                  "border-red-500"
                              )}
                            />
                          </div>
                        </div>

                        {/* Formatted Display */}
                        {values.arrivalDateTime && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(values.arrivalDateTime).toLocaleString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </div>
                        )}
                        <ErrorMessage
                          name="arrivalDateTime"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>
                    </div>

                    {/* Duration Validation Error */}
                    {values.departureDateTime &&
                      values.arrivalDateTime &&
                      (() => {
                        const duration =
                          (new Date(values.arrivalDateTime) -
                            new Date(values.departureDateTime)) /
                          (1000 * 60);
                        if (duration < 0) {
                          return (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mt-4">
                              <div className="flex-shrink-0">
                                <svg
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div>
                                <strong>Invalid Duration:</strong> Arrival time
                                must be after departure time
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                  </CardContent>
                </Card>

                {/* Flight Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Flight Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="status">Status *</Label>
                      <Select
                        value={values.status}
                        onValueChange={(value) =>
                          setFieldValue("status", value)
                        }
                        disabled
                      >
                        <SelectTrigger
                          className={cn(
                            "mt-1 w-full",
                            errors.status && touched.status && "border-red-500"
                          )}
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    option.color.split(" ")[0]
                                  )}
                                />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ErrorMessage
                        name="status"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                      {isEditMode && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Status changes use the lifecycle control on the instance
                          list or detail page.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Flight Instance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Flight Info */}
                    {values.flightId && (
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-base">
                            {getSelectedFlight(values.flightId)?.flightNumber ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>
                            Aircraft:{" "}
                            {getSelectedFlight(values.flightId)?.aircraft
                              ?.model || "N/A"}
                          </div>
                          <div>
                            Airline:{" "}
                            {getSelectedFlight(values.flightId)?.airline
                              ?.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Route */}
                    {values.departureAirportId && values.arrivalAirportId && (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <div>
                              <div className="text-xs text-muted-foreground">
                                From
                              </div>
                              <div className="font-medium text-sm">
                                {airportOptions.find(
                                  (a) =>
                                    String(a.id) ===
                                    String(values.departureAirportId)
                                )?.iataCode || values.departureAirportId}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {airportOptions.find(
                                  (a) =>
                                    String(a.id) ===
                                    String(values.departureAirportId)
                                )?.city?.name || ""}
                              </div>
                            </div>
                            <div className="flex items-center justify-center">
                              <div className="h-px bg-border w-full" />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                To
                              </div>
                              <div className="font-medium text-sm">
                                {airportOptions.find(
                                  (a) =>
                                    String(a.id) ===
                                    String(values.arrivalAirportId)
                                )?.iataCode || values.arrivalAirportId}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {airportOptions.find(
                                  (a) =>
                                    String(a.id) ===
                                    String(values.arrivalAirportId)
                                )?.city?.name || ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Schedule */}
                    {values.departureDateTime && values.arrivalDateTime && (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-2 text-sm">
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Departure
                              </div>
                              <div className="font-medium">
                                {new Date(
                                  values.departureDateTime
                                ).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-muted-foreground">
                                {new Date(
                                  values.departureDateTime
                                ).toLocaleString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Arrival
                              </div>
                              <div className="font-medium">
                                {new Date(
                                  values.arrivalDateTime
                                ).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-muted-foreground">
                                {new Date(
                                  values.arrivalDateTime
                                ).toLocaleString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            </div>
                            {/* Duration */}
                            {(() => {
                              const duration =
                                (new Date(values.arrivalDateTime) -
                                  new Date(values.departureDateTime)) /
                                (1000 * 60);
                              const hours = Math.floor(Math.abs(duration) / 60);
                              const minutes = Math.floor(
                                Math.abs(duration) % 60
                              );
                              const isNegative = duration < 0;

                              return (
                                <div
                                  className={cn(
                                    "pt-1 border-t",
                                    isNegative && "text-red-600"
                                  )}
                                >
                                  <span className="text-xs">Duration: </span>
                                  <span className="font-medium">
                                    {isNegative && "- "}
                                    {hours}h {minutes}m
                                    {isNegative && " (Invalid)"}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    {values.status && (
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-1">
                          Status
                        </div>
                        <Badge
                          className={cn(
                            "font-medium",
                            statusOptions.find((s) => s.value === values.status)
                              ?.color || ""
                          )}
                        >
                          {statusOptions.find((s) => s.value === values.status)
                            ?.label || values.status}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting || instanceLoading}
                        className="w-full"
                      >
                        {isSubmitting || instanceLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            {isEditMode ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {isEditMode ? "Update Instance" : "Create Instance"}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/airline/instances")}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                    {errors.submit && (
                      <div className="mt-3 text-red-500 text-sm">
                        {errors.submit}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default FlightInstanceForm;
