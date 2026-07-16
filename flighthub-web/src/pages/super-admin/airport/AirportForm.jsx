import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Plane,
  MapPin,
  Globe,
  BarChart3,
  Users,
  Star,
  TrendingUp,
  Clock,
  Hash,
  AlertTriangle,
  CheckCircle,
  Image,
  Upload,
  Trash2,
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
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteAirportHeroImage,
  fetchTimezones,
  uploadAirportHeroImage,
} from "@/Redux/airport/airportThunk";


// Size category options
const SIZE_CATEGORIES = [
  { value: "LARGE_HUB", label: "Large Hub" },
  { value: "MEDIUM_HUB", label: "Medium Hub" },
  { value: "SMALL_HUB", label: "Small Hub" },
  { value: "NON_HUB", label: "Non-Hub" },
];

const getAirportFormReadiness = (values) => {
  const blockers = [];

  if (!values.iataCode) blockers.push("IATA code is required");
  if (!values.name) blockers.push("Airport name is required");
  if (!values.cityId) blockers.push("City is required");
  if (!values.timeZone) blockers.push("Timezone is required");
  if (!values.latitude || !values.longitude) blockers.push("Coordinates are recommended for search quality");

  return {
    ready: blockers.length === 0,
    blockers,
  };
};

const isValidImageUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

const AirportForm = ({ airport, cities = [], onSubmit, isLoading = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(airport?.id || id);

  // Redux
  const dispatch = useDispatch();
  const { timezones, timezonesLoading, actionLoading } = useSelector((state) => state.airport);

  // Fetch timezones on mount
  useEffect(() => {
    if (timezones.length === 0 && !timezonesLoading) {
      dispatch(fetchTimezones());
    }
  }, [dispatch, timezones.length, timezonesLoading]);

  // Initial form values
  const initialValues = {
    iataCode: airport?.iataCode || "",
    name: airport?.name || "",
    timeZone: airport?.timeZone || "",
    cityId: airport?.city?.id ? String(airport.city.id) : "",

    // Address (only street-level details)
    street: airport?.address?.street || "",
    postalCode: airport?.address?.postalCode || "",

    // GeoCode
    latitude: airport?.geoCode?.latitude || "",
    longitude: airport?.geoCode?.longitude || "",
    heroImageUrl: airport?.heroImageUrl || "",

    // Analytics
    travelerScore: airport?.analytics?.travelerScore || "",
    annualPassengers: airport?.analytics?.annualPassengers || "",
    destinationsCount: airport?.analytics?.destinationsCount || "",
    sizeCategory: airport?.analytics?.sizeCategory || "",
    airlinesCount: airport?.analytics?.airlinesCount || "",
    onTimePerformance: airport?.analytics?.onTimePerformance || "",
  };

  // Validation schema
  const validationSchema = Yup.object({
    iataCode: Yup.string()
      .length(3, "IATA code must be exactly 3 characters")
      .matches(/^[A-Z]{3}$/, "IATA code must contain only uppercase letters")
      .required("IATA code is required"),
    name: Yup.string()
      .min(2, "Airport name must be at least 2 characters")
      .max(255, "Airport name must be less than 255 characters")
      .required("Airport name is required"),
    timeZone: Yup.string().required("Time zone is required"),
    cityId: Yup.string().required("City is required"),
    street: Yup.string().max(255, "Street must be less than 255 characters"),
    postalCode: Yup.string().max(20, "Postal code must be less than 20 characters"),
    latitude: Yup.number()
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .nullable(),
    longitude: Yup.number()
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .nullable(),
    travelerScore: Yup.number()
      .min(0, "Score must be between 0 and 100")
      .max(100, "Score must be between 0 and 100")
      .nullable(),
    annualPassengers: Yup.number().min(0, "Must be positive").nullable(),
    destinationsCount: Yup.number()
      .min(0, "Must be positive")
      .integer("Must be a whole number")
      .nullable(),
    sizeCategory: Yup.string().max(20, "Must be less than 20 characters"),
    airlinesCount: Yup.number()
      .min(0, "Must be positive")
      .integer("Must be a whole number")
      .nullable(),
    onTimePerformance: Yup.number()
      .min(0, "Must be between 0 and 100")
      .max(100, "Must be between 0 and 100")
      .nullable(),
    heroImageUrl: Yup.string()
      .test("is-url", "Enter a valid http(s) image URL", isValidImageUrl)
      .max(1024, "Image URL must be less than 1024 characters"),
  });

  const handleHeroUpload = async (event, setFieldValue) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !airport?.id) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WEBP image");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Airport image must be 8MB or smaller");
      return;
    }

    try {
      const updated = await dispatch(uploadAirportHeroImage({ airportId: airport.id, file })).unwrap();
      setFieldValue("heroImageUrl", updated.heroImageUrl || "");
      toast.success("Airport image uploaded");
    } catch (error) {
      toast.error(error || "Unable to upload airport image");
    }
  };

  const handleHeroDelete = async (setFieldValue) => {
    if (!airport?.id) {
      setFieldValue("heroImageUrl", "");
      return;
    }

    try {
      await dispatch(deleteAirportHeroImage(airport.id)).unwrap();
      setFieldValue("heroImageUrl", "");
      toast.success("Airport image removed");
    } catch (error) {
      toast.error(error || "Unable to remove airport image");
    }
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const formattedValues = {
        iataCode: values.iataCode,
        name: values.name,
        timeZone: values.timeZone,
        cityId: parseInt(values.cityId),
        address:
          values.street || values.postalCode
            ? {
                street: values.street || null,
                postalCode: values.postalCode || null,
              }
            : null,
        geoCode:
          values.latitude && values.longitude
            ? {
                latitude: parseFloat(values.latitude),
                longitude: parseFloat(values.longitude),
              }
            : null,
        analytics:
          values.travelerScore ||
          values.annualPassengers ||
          values.destinationsCount ||
          values.sizeCategory ||
          values.airlinesCount ||
          values.onTimePerformance
            ? {
                travelerScore: values.travelerScore
                  ? parseInt(values.travelerScore)
                  : null,
                annualPassengers: values.annualPassengers
                  ? parseFloat(values.annualPassengers)
                  : null,
                destinationsCount: values.destinationsCount
                  ? parseInt(values.destinationsCount)
                  : null,
                sizeCategory: values.sizeCategory || null,
                airlinesCount: values.airlinesCount
                  ? parseInt(values.airlinesCount)
                  : null,
                onTimePerformance: values.onTimePerformance
                  ? parseFloat(values.onTimePerformance)
                  : null,
              }
            : null,
        heroImageUrl: values.heroImageUrl || null,
      };

      if (onSubmit) {
        await onSubmit(formattedValues);
        toast.success(isEditing ? "Airport updated" : "Airport created");

        if (!isEditing) {
          resetForm();
        }
      }

      console.log("Airport Data:", formattedValues);
    } catch (error) {
      console.error("Error saving airport:", error);
      toast.error("Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page-surface min-h-screen dark:text-white">
      <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full">
        <div className="flex items-center space-x-4 p-4 border-b bg-gray-50/50 dark:bg-slate-950 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-sm text-gray-500 dark:text-gray-300 font-medium">
            / Airport / {isEditing ? "Edit" : "New Airport"}
          </div>
        </div>

        <div className="sticky top-0 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-gray-700 p-6 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-slate-800 p-3 rounded-lg">
                  <Plane className="h-6 w-6 text-blue-600" />
                </div>
                {isEditing ? "Edit Airport" : "Create New Airport"}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Configure airport information, location details, and analytics
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-gray-700 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">✈️ Airport Management</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Define comprehensive airport data</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting, values, setFieldValue }) => {
              const searchReadiness = getAirportFormReadiness(values);

              return (
              <Form className="space-y-8">
                {/* Basic Information */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-blue-600" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="iataCode" className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-blue-600" />
                          IATA Code *
                        </Label>
                        <Field name="iataCode">
                          {({ field }) => (
                            <Input
                              {...field}
                              id="iataCode"
                              maxLength={3}
                              placeholder="JFK"
                              className="w-full uppercase"
                              onChange={(e) =>
                                setFieldValue("iataCode", e.target.value.toUpperCase())
                              }
                            />
                          )}
                        </Field>
                        <ErrorMessage
                          name="iataCode"
                          component="div"
                          className="text-sm text-red-600 mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Exactly 3 uppercase letters
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-blue-600" />
                          Airport Name *
                        </Label>
                        <Field
                          as={Input}
                          id="name"
                          name="name"
                          className="w-full"
                          placeholder="John F. Kennedy International Airport"
                        />
                        <ErrorMessage
                          name="name"
                          component="div"
                          className="text-sm text-red-600 mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Traveler Image */}
                <Card className="border-l-4 border-l-cyan-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5 text-cyan-600" />
                      Traveler Route Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="heroImageUrl" className="flex items-center gap-2">
                          <Image className="h-4 w-4 text-cyan-600" />
                          Hero image URL
                        </Label>
                        <Field
                          as={Input}
                          id="heroImageUrl"
                          name="heroImageUrl"
                          className="w-full"
                          placeholder="https://cdn.example.com/airports/sgn.jpg"
                        />
                        <ErrorMessage
                          name="heroImageUrl"
                          component="div"
                          className="mt-1 text-sm text-red-600"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Used by traveler Trending routes and destination cards. Upload is available after the airport exists.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <input
                          id="airport-hero-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(event) => handleHeroUpload(event, setFieldValue)}
                          disabled={!isEditing || actionLoading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!isEditing || actionLoading}
                          onClick={() => document.getElementById("airport-hero-upload")?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload image
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={actionLoading || !values.heroImageUrl}
                          onClick={() => handleHeroDelete(setFieldValue)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>

                      {!isEditing && (
                        <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200">
                          Save this airport first, then edit it to upload a local image file.
                        </p>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-2xl border bg-muted/30">
                      {values.heroImageUrl ? (
                        <img
                          src={values.heroImageUrl}
                          alt=""
                          className="h-48 w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Image className="h-8 w-8" />
                          <span className="text-sm font-medium">No airport image</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Location Details */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Location Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cityId" className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-green-600" />
                          City *
                        </Label>
                        <Select
                          value={values.cityId}
                          onValueChange={(value) => setFieldValue("cityId", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a city" />
                          </SelectTrigger>
                          <SelectContent>
                            {cities && cities.length > 0 ? (
                              cities.map((city) => (
                                <SelectItem key={city.id} value={String(city.id)}>
                                  {city.cityCode} - {city.name}, {city.countryName || city.countryCode}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-cities" disabled>
                                No cities available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <ErrorMessage
                          name="cityId"
                          component="div"
                          className="text-sm text-red-600 mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          City provides country and region information
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="timeZone" className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          Time Zone *
                        </Label>
                        <Select
                          value={values.timeZone}
                          onValueChange={(value) => setFieldValue("timeZone", value)}
                          disabled={timezonesLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={timezonesLoading ? "Loading timezones..." : "Select timezone"} />
                          </SelectTrigger>
                          <SelectContent>
                            {!timezonesLoading && timezones.length > 0 ? (
                              timezones.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
                                </SelectItem>
                              ))
                            ) : timezonesLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading timezones...
                              </SelectItem>
                            ) : (
                              <SelectItem value="no-tz" disabled>
                                No timezones available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <ErrorMessage
                          name="timeZone"
                          component="div"
                          className="text-sm text-red-600 mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-purple-600" />
                      Address Information (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Field
                          as={Input}
                          id="street"
                          name="street"
                          className="w-full"
                          placeholder="123 Airport Avenue"
                        />
                        <ErrorMessage
                          name="street"
                          component="div"
                          className="text-sm text-red-600 mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          City/Country information comes from the selected City
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Field
                          as={Input}
                          id="postalCode"
                          name="postalCode"
                          className="w-full"
                          placeholder="11430"
                        />
                        <ErrorMessage
                          name="postalCode"
                          component="div"
                          className="text-sm text-red-600 mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Geographic Coordinates */}
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      Geographic Coordinates (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude">Latitude</Label>
                        <Field
                          as={Input}
                          id="latitude"
                          name="latitude"
                          type="number"
                          step="any"
                          className="w-full"
                          placeholder="40.641766"
                        />
                        <ErrorMessage
                          name="latitude"
                          component="div"
                          className="text-sm text-red-600 mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Decimal degrees (-90 to 90)
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="longitude">Longitude</Label>
                        <Field
                          as={Input}
                          id="longitude"
                          name="longitude"
                          type="number"
                          step="any"
                          className="w-full"
                          placeholder="-73.780968"
                        />
                        <ErrorMessage
                          name="longitude"
                          component="div"
                          className="text-sm text-red-600 mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Decimal degrees (-180 to 180)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>



                {/* Summary Card */}
                <Card className="bg-blue-50/50 dark:bg-slate-900 border-blue-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                      <Plane className="h-5 w-5" />
                      Airport Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-5">
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-900 mb-2">Basic Info</h4>
                        <div className="flex items-center justify-between">
                          <span>IATA Code:</span>
                          <Badge variant="secondary" className="font-mono">
                            {values.iataCode || "N/A"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Name:</span>
                          <span className="font-medium text-xs truncate max-w-[120px]">
                            {values.name || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-900 mb-2">Location</h4>
                        <div className="flex items-center justify-between">
                          <span>City ID:</span>
                          <span className="font-medium">{values.cityId || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Timezone:</span>
                          <span className="font-medium text-xs truncate max-w-[120px]">
                            {values.timeZone || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-900 mb-2">Coordinates</h4>
                        <div className="flex items-center justify-between">
                          <span>Latitude:</span>
                          <span className="font-medium">{values.latitude || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Longitude:</span>
                          <span className="font-medium">{values.longitude || "N/A"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-900 mb-2">Analytics</h4>
                        <div className="flex items-center justify-between">
                          <span>Score:</span>
                          <span className="font-medium">{values.travelerScore || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Category:</span>
                          <span className="font-medium text-xs">
                            {values.sizeCategory
                              ? SIZE_CATEGORIES.find((c) => c.value === values.sizeCategory)
                                  ?.label || values.sizeCategory
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-900 mb-2">Media</h4>
                        <div className="flex items-center justify-between">
                          <span>Hero image:</span>
                          <Badge variant={values.heroImageUrl ? "default" : "outline"}>
                            {values.heroImageUrl ? "Ready" : "Fallback"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={searchReadiness.ready ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20" : "border-orange-200 bg-orange-50/70 dark:border-orange-900/60 dark:bg-orange-950/20"}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {searchReadiness.ready ? (
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-300" />
                      )}
                      <div>
                        <p className={searchReadiness.ready ? "font-semibold text-emerald-800 dark:text-emerald-100" : "font-semibold text-orange-800 dark:text-orange-100"}>
                          {searchReadiness.ready ? "Airport is search-ready" : "Airport needs review for search readiness"}
                        </p>
                        <p className={searchReadiness.ready ? "mt-1 text-sm text-emerald-700 dark:text-emerald-200" : "mt-1 text-sm text-orange-700 dark:text-orange-200"}>
                          {searchReadiness.ready
                            ? "This airport has route, timezone and coordinate data needed by traveler search and booking flows."
                            : searchReadiness.blockers.join(", ")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Form Actions */}
                <div className="sticky bottom-0 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-gray-700 p-6 z-10 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Airport: {values.name || "Untitled"}</span>
                      {values.iataCode && (
                        <span className="ml-2 text-gray-500">• {values.iataCode}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="min-w-[100px]"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex min-w-[140px] items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSubmitting
                          ? "Saving..."
                          : isEditing
                          ? "Update Airport"
                          : "Create Airport"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default AirportForm;
