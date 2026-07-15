import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plane,
  Building2,
  Globe,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Image,
  Shield
} from "lucide-react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { getAllCities } from "@/Redux/city/cityThunk";

const validationSchema = Yup.object({
  iataCode: Yup.string()
    .required("IATA code is required")
    .matches(/^[A-Z0-9]{2}$/, "IATA code must be exactly 2 uppercase letters or numbers"),
  icaoCode: Yup.string()
    .required("ICAO code is required")
    .matches(/^[A-Z]{3}$/, "ICAO code must be exactly 3 uppercase letters"),
  airlineName: Yup.string()
    .required("Airline name is required")
    .min(2, "Airline name must be at least 2 characters"),
  headquartersCity: Yup.string().required("Headquarters city is required"),
  website: Yup.string()
    .trim()
    .matches(/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/, {
      message: "Enter a valid website",
      excludeEmptyString: true
    })
    .nullable(),
  logoUrl: Yup.string()
    .trim()
    .matches(/^https?:\/\/.+/, {
      message: "Enter a valid http(s) logo URL",
      excludeEmptyString: true
    })
    .nullable()
});

const AirlineDetailsStep = ({ data, onDataChange, onNext, onPrevious }) => {
  const [logoPreview, setLogoPreview] = useState(data?.logoUrl || "");
  const { cityList: cities } = useSelector((state) => state.city);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllCities());
  }, [dispatch]);

  // console.

  const initialValues = {
    iataCode: data?.iataCode || "",
    icaoCode: data?.icaoCode || "",
    airlineName: data?.airlineName || "",
    alias: data?.alias || "",
    logoUrl: data?.logoUrl || "",
    website: data?.website || "",
    alliance: data?.alliance || "",
   
    headquartersCity: data?.headquartersCity || "",
  };

  // Country selection removed: backend does not use this field

  const alliances = ["Star Alliance", "SkyTeam", "Oneworld", "Unaligned"];

  

  const handleSubmit = (values) => {
    onDataChange(values);
    onNext();
  };

  const inputStateClass = (meta) => {
    if (meta?.touched && meta?.error) {
      return "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500 dark:focus:ring-red-500/20";
    }

    if (meta?.touched && !meta?.error) {
      return "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-emerald-500 dark:focus:ring-emerald-500/20";
    }

    return "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/20";
  };

  const baseInputClass =
    "h-12 rounded-lg bg-white/90 text-slate-950 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:shadow-md focus:shadow-lg dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-500";

  const FormField = ({ name, label, children, required = false, helpText, ...props }) => (
    <div className="space-y-2">
      <label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
        {props.icon && <props.icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </label>
      {children}
      <ErrorMessage
        name={name}
        component="div"
        className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
      />
      {helpText && (
        <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{helpText}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg shadow-blue-500/20 sm:h-16 sm:w-16">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="mb-2 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
            Airline Details & Branding
          </h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-lg">
            Enter your airline's identity, codes and brand assets to get listed.
          </p>
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, isValid }) => {
          return (
            <Form className="space-y-5">
              {/* IATA and ICAO Codes */}
              <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
                    <Plane className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-950 dark:text-white">Airline Identification Codes</h4>
                    <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">Official IATA and ICAO codes for your airline</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormField
                    name="iataCode"
                    label="IATA Code"
                    icon={Plane}
                    required={true}
                    helpText="2-letter code assigned by IATA (e.g., AA for American Airlines)"
                  >
                    <Field name="iataCode">
                      {({ field, meta }) => (
                        <div className="relative">
                          <Input
                            {...field}
                            id="iataCode"
                            placeholder="e.g., AA"
                            maxLength={2}
                            className={`${baseInputClass} pr-10 text-center font-mono text-lg uppercase ${inputStateClass(meta)}`}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase();
                              setFieldValue("iataCode", value);
                            }}
                          />
                          {meta.touched && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {meta.error ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Field>
                  </FormField>

                  <FormField
                    name="icaoCode"
                    label="ICAO Code"
                    icon={Plane}
                    required={true}
                    helpText="3-letter code assigned by ICAO (e.g., AAL for American Airlines)"
                  >
                    <Field name="icaoCode">
                      {({ field, meta }) => (
                        <div className="relative">
                          <Input
                            {...field}
                            id="icaoCode"
                            placeholder="e.g., AAL"
                            maxLength={3}
                            className={`${baseInputClass} pr-10 text-center font-mono text-lg uppercase ${inputStateClass(meta)}`}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase();
                              setFieldValue("icaoCode", value);
                            }}
                          />
                          {meta.touched && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {meta.error ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Field>
                  </FormField>
                </div>
              </section>

              {/* Airline Name and Alias */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  name="airlineName"
                  label="Airline Name"
                  icon={Building2}
                >
                  <Field name="airlineName">
                    {({ field, meta }) => (
                      <Input
                        {...field}
                        id="airlineName"
                        placeholder="Enter airline name"
                        className={`${baseInputClass} ${inputStateClass(meta)}`}
                      />
                    )}
                  </Field>
                </FormField>

                <FormField name="alias" label="Alias (Optional)">
                  <Field name="alias">
                    {({ field }) => (
                      <Input
                        {...field}
                        id="alias"
                        placeholder="Enter airline alias"
                        className={baseInputClass}
                      />
                    )}
                  </Field>
                </FormField>
              </div>

              {/* Country and Headquarters */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Country field removed (not used by backend) */}

                <FormField
                  name="headquartersCity"
                  label="Headquarters City"
                  icon={MapPin}
                >
                  <Select
                    value={values.headquartersCity}
                    onValueChange={(value) =>
                      setFieldValue("headquartersCity", value)
                    }
                  >
                    <SelectTrigger

                      className={`h-12 w-full rounded-lg bg-white/90 text-slate-950 shadow-sm transition-all duration-200 hover:shadow-md focus:shadow-lg dark:border-white/10 dark:bg-slate-950/60 dark:text-white ${
                        values.headquartersCity === "" ? "border-red-500 dark:border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Search and select a city..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {cities &&
                        cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name} ({city.cityCode}) – {city.countryName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              {/* Logo Upload Section */}
              <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                    <Image className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-950 dark:text-white">Brand Identity</h4>
                    <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                      Add a hosted logo now, or upload a local logo from your airline profile after registration.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
                    <div className="w-full flex-1">
                      <Field name="logoUrl">
                        {({ field }) => (
                          <Input
                            {...field}
                            id="logoUrl"
                            placeholder="https://cdn.example.com/logo.png"
                            className={baseInputClass}
                            onChange={(e) => {
                              setFieldValue("logoUrl", e.target.value);
                              setLogoPreview(e.target.value);
                            }}
                          />
                        )}
                      </Field>
                    </div>
                  </div>

                  {logoPreview && (
                    <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/50">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-20 w-20 rounded-lg border border-slate-200 bg-white object-contain p-2 shadow-sm dark:border-white/10"
                        onError={() => setLogoPreview("")}
                      />
                      <div>
                        <p className="font-medium text-slate-950 dark:text-white">Logo Preview</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">This is how your logo will appear</p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Recommended: PNG or SVG format, minimum 200x200px, transparent background. Local upload is available after the airline profile exists.
                  </p>
                </div>
              </section>

              {/* Website */}
              <FormField name="website" label="Website (Optional)" icon={Globe}>
                <Field name="website">
                  {({ field }) => (
                    <Input
                      {...field}
                      id="website"
                      placeholder="https://example.com"
                      className={baseInputClass}
                    />
                  )}
                </Field>
              </FormField>

              {/* Review status and Alliance */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-300" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">Pending review</p>
                      <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-200">
                        New airline registrations are submitted as pending until a super admin approves them.
                      </p>
                    </div>
                  </div>
                </div>

                <FormField name="alliance" label="Alliance (Optional)">
                  <Select
                    onValueChange={(value) => setFieldValue("alliance", value)}
                    value={values.alliance}
                  >
                    <SelectTrigger className="h-12 rounded-lg bg-white/90 text-slate-950 shadow-sm transition-all duration-200 hover:shadow-md focus:shadow-lg dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
                      <SelectValue placeholder="Select alliance" />
                    </SelectTrigger>
                    <SelectContent>
                      {alliances.map((alliance) => (
                        <SelectItem key={alliance} value={alliance}>
                          {alliance}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              
              {/* Navigation Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-white/10 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPrevious}
                  className="h-11 rounded-lg px-5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous Step
                </Button>

                <Button
                  type="submit"
                  disabled={!isValid}
                  className="h-11 rounded-lg px-5"
                >
                  Save & Continue
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default AirlineDetailsStep;
