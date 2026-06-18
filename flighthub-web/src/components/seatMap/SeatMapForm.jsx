import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SpinnerLoader } from "@/components/common/Loader";
import { AlertCircle, Grid3X3, Plus, Save, Trash2 } from "lucide-react";
import {
  createSeatMap,
  getSeatMapsByCabinClass,
  updateSeatMap,
} from "@/Redux/SeatMap/seatMapThunk";
import { seatMapValues } from "./seatMapValue";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

// Validation Schema
const seatMapValidationSchema = Yup.object({
  name: Yup.string()
    .required("Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters"),
  totalRows: Yup.number()
    .required("Total rows is required")
    .min(1, "Must have at least 1 row")
    .max(100, "Cannot exceed 100 rows")
    .integer("Must be a whole number"),
  leftSeatsPerRow: Yup.number()
    .required("Left seats per row is required")
    .min(1, "Must have at least 1 seat")
    .max(10, "Cannot exceed 10 seats per side")
    .integer("Must be a whole number"),
  rightSeatsPerRow: Yup.number()
    .required("Right seats per row is required")
    .min(1, "Must have at least 1 seat")
    .max(10, "Cannot exceed 10 seats per side")
    .integer("Must be a whole number"),
  zones: Yup.array().of(
    Yup.object({
      name: Yup.string().required("Zone name is required"),
      startRow: Yup.number().required("Start row is required").min(1).integer(),
      endRow: Yup.number()
        .required("End row is required")
        .min(Yup.ref("startRow"), "End row must be after start row")
        .integer(),
      leftSeatsPerRow: Yup.number().required("Left seats is required").min(0).max(10).integer(),
      rightSeatsPerRow: Yup.number().required("Right seats is required").min(0).max(10).integer(),
      seatsInLastRow: Yup.mixed().test(
        "valid-partial-last-row",
        "Partial last row must be between 1 and seats per row",
        function (value) {
          if (value === "" || value === null || value === undefined) return true;
          const numericValue = Number(value);
          const seatsPerRow =
            Number(this.parent.leftSeatsPerRow || 0) +
            Number(this.parent.rightSeatsPerRow || 0);
          return numericValue >= 1 && numericValue <= seatsPerRow;
        },
      ),
    }),
  ),
});

const SeatMapForm = ({
  isEdit = false,
  onSuccess,
  onCancel,
  className = "",
}) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.seatMap || {});

  const { cabinId } = useParams();
  const {seatMap}= useSelector(state => state.seatMap);
  const formInitialValues = useMemo(() => {
    if (!seatMap) return seatMapValues;

    return {
      name: seatMap.name || '',
      totalRows: seatMap.totalRows || 12,
      leftSeatsPerRow: seatMap.leftSeatsPerRow || 3,
      rightSeatsPerRow: seatMap.rightSeatsPerRow || 3,
      zones: seatMap.zones?.length ? seatMap.zones.map((zone, index) => ({
        name: zone.name || `Zone ${index + 1}`,
        startRow: zone.startRow || 1,
        endRow: zone.endRow || seatMap.totalRows || 12,
        leftSeatsPerRow: zone.leftSeatsPerRow ?? seatMap.leftSeatsPerRow ?? 3,
        rightSeatsPerRow: zone.rightSeatsPerRow ?? seatMap.rightSeatsPerRow ?? 3,
        seatsInLastRow: zone.seatsInLastRow || '',
        displayOrder: zone.displayOrder || index + 1,
      })) : seatMapValues.zones,
    };
  }, [seatMap]);

  // Formik configuration
  const formik = useFormik({
    initialValues: formInitialValues,
    enableReinitialize: true,
    validationSchema: seatMapValidationSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        console.log("Submitting seat map form with values:", values);

        const cleanedZones = (values.zones || []).map((zone, index) => ({
          name: zone.name,
          startRow: Number(zone.startRow),
          endRow: Number(zone.endRow),
          leftSeatsPerRow: Number(zone.leftSeatsPerRow),
          rightSeatsPerRow: Number(zone.rightSeatsPerRow),
          seatsInLastRow:
            zone.seatsInLastRow === "" || zone.seatsInLastRow === null || zone.seatsInLastRow === undefined
              ? null
              : Number(zone.seatsInLastRow),
          displayOrder: Number(zone.displayOrder || index + 1),
        }));

        const seatMapData = {
          ...values,
          totalRows: Number(values.totalRows),
          leftSeatsPerRow: Number(values.leftSeatsPerRow),
          rightSeatsPerRow: Number(values.rightSeatsPerRow),
          zones: cleanedZones,
          cabinClassId: parseInt(cabinId),
        };

        // TODO: Dispatch createSeatMap or updateSeatMap thunk
        var result;
        if (isEdit && seatMap) {
          const updateData={
              id: seatMap?.id,
              data: seatMapData,
            }
            console.log("Update data:", updateData);
          result = await dispatch(
            updateSeatMap(updateData)
          ).unwrap();
        } else {
          result = await dispatch(createSeatMap(seatMapData)).unwrap();
        }

        if (onSuccess) {
          onSuccess(result);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        // Handle specific field errors if provided by backend
        if (error.includes("name") || error.includes("duplicate")) {
          setFieldError("name", "This seat map name is already in use");
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (isEdit && cabinId) {
      dispatch(getSeatMapsByCabinClass(cabinId));
    }
  }, [isEdit, cabinId, dispatch]);

  const handleCancel = () => {
    formik.resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  // Calculate total seats
  const totalSeats =
    formik.values.totalRows *
    (formik.values.leftSeatsPerRow + formik.values.rightSeatsPerRow);
  const zoneTotalSeats = (formik.values.zones || []).reduce((sum, zone) => {
    const rows = Math.max(0, Number(zone.endRow || 0) - Number(zone.startRow || 0) + 1);
    const seatsPerRow = Number(zone.leftSeatsPerRow || 0) + Number(zone.rightSeatsPerRow || 0);
    if (!rows || !seatsPerRow) return sum;
    const partialLastRow = zone.seatsInLastRow === "" ? null : Number(zone.seatsInLastRow);
    return sum + rows * seatsPerRow - (partialLastRow ? seatsPerRow - partialLastRow : 0);
  }, 0);

  const addZone = () => {
    const lastZone = formik.values.zones?.[formik.values.zones.length - 1];
    const nextStartRow = Number(lastZone?.endRow || 0) + 1;
    const nextZone = {
      name: `Zone ${(formik.values.zones?.length || 0) + 1}`,
      startRow: nextStartRow || 1,
      endRow: (nextStartRow || 1) + 4,
      leftSeatsPerRow: formik.values.leftSeatsPerRow,
      rightSeatsPerRow: formik.values.rightSeatsPerRow,
      seatsInLastRow: '',
      displayOrder: (formik.values.zones?.length || 0) + 1,
    };
    formik.setFieldValue('zones', [...(formik.values.zones || []), nextZone]);
  };

  const removeZone = (index) => {
    const zones = [...(formik.values.zones || [])];
    zones.splice(index, 1);
    formik.setFieldValue('zones', zones.length ? zones : seatMapValues.zones);
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Grid3X3 className="h-5 w-5 mr-2" />
            {isEdit ? "Edit Seat Map" : "Create Seat Map"}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {isEdit
              ? "Update the seat map layout and configuration"
              : "Configure the seat layout for this cabin class"}
          </p>
        </CardHeader>

        <CardContent>
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-5">
                Seat Map Information
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Seat Map Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g., Economy Class Layout, Business Premium Layout"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={
                      formik.errors.name && formik.touched.name
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formik.errors.name && formik.touched.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {formik.errors.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    A descriptive name for this seat map configuration
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Layout Configuration */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Layout Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="totalRows">Total Rows *</Label>
                  <Input
                    id="totalRows"
                    name="totalRows"
                    type="number"
                    min="1"
                    max="100"
                    value={formik.values.totalRows}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={
                      formik.errors.totalRows && formik.touched.totalRows
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formik.errors.totalRows && formik.touched.totalRows && (
                    <p className="text-sm text-red-600 mt-1">
                      {formik.errors.totalRows}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Number of seat rows
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leftSeatsPerRow">Left Seats per Row *</Label>
                  <Input
                    id="leftSeatsPerRow"
                    name="leftSeatsPerRow"
                    type="number"
                    min="1"
                    max="10"
                    value={formik.values.leftSeatsPerRow}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={
                      formik.errors.leftSeatsPerRow &&
                      formik.touched.leftSeatsPerRow
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formik.errors.leftSeatsPerRow &&
                    formik.touched.leftSeatsPerRow && (
                      <p className="text-sm text-red-600 mt-1">
                        {formik.errors.leftSeatsPerRow}
                      </p>
                    )}
                  <p className="text-xs text-gray-500 mt-1">
                    Seats on left side of aisle
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rightSeatsPerRow">
                    Right Seats per Row *
                  </Label>
                  <Input
                    id="rightSeatsPerRow"
                    name="rightSeatsPerRow"
                    type="number"
                    min="1"
                    max="10"
                    value={formik.values.rightSeatsPerRow}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={
                      formik.errors.rightSeatsPerRow &&
                      formik.touched.rightSeatsPerRow
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formik.errors.rightSeatsPerRow &&
                    formik.touched.rightSeatsPerRow && (
                      <p className="text-sm text-red-600 mt-1">
                        {formik.errors.rightSeatsPerRow}
                      </p>
                    )}
                  <p className="text-xs text-gray-500 mt-1">
                    Seats on right side of aisle
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Seat Map Zones</h3>
                  <p className="text-sm text-gray-600">
                    Use row ranges and partial final rows for exact production layouts.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={addZone}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Zone
                </Button>
              </div>

              <div className="space-y-4">
                {(formik.values.zones || []).map((zone, index) => {
                  const seatsPerRow = Number(zone.leftSeatsPerRow || 0) + Number(zone.rightSeatsPerRow || 0);
                  const rows = Math.max(0, Number(zone.endRow || 0) - Number(zone.startRow || 0) + 1);
                  const zoneSeats =
                    rows * seatsPerRow -
                    (zone.seatsInLastRow ? seatsPerRow - Number(zone.seatsInLastRow) : 0);

                  return (
                    <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">Zone {index + 1}</p>
                          <p className="text-xs text-gray-500">
                            {zoneSeats || 0} seats • rows {zone.startRow || '-'}-{zone.endRow || '-'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeZone(index)}
                          disabled={(formik.values.zones || []).length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor={`zones.${index}.name`}>Name</Label>
                          <Input
                            id={`zones.${index}.name`}
                            name={`zones.${index}.name`}
                            value={zone.name}
                            onChange={formik.handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`zones.${index}.startRow`}>Start</Label>
                          <Input
                            id={`zones.${index}.startRow`}
                            name={`zones.${index}.startRow`}
                            type="number"
                            min="1"
                            value={zone.startRow}
                            onChange={formik.handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`zones.${index}.endRow`}>End</Label>
                          <Input
                            id={`zones.${index}.endRow`}
                            name={`zones.${index}.endRow`}
                            type="number"
                            min="1"
                            value={zone.endRow}
                            onChange={formik.handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`zones.${index}.leftSeatsPerRow`}>Left</Label>
                          <Input
                            id={`zones.${index}.leftSeatsPerRow`}
                            name={`zones.${index}.leftSeatsPerRow`}
                            type="number"
                            min="0"
                            value={zone.leftSeatsPerRow}
                            onChange={formik.handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`zones.${index}.rightSeatsPerRow`}>Right</Label>
                          <Input
                            id={`zones.${index}.rightSeatsPerRow`}
                            name={`zones.${index}.rightSeatsPerRow`}
                            type="number"
                            min="0"
                            value={zone.rightSeatsPerRow}
                            onChange={formik.handleChange}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor={`zones.${index}.seatsInLastRow`}>
                            Partial Last Row
                          </Label>
                          <Input
                            id={`zones.${index}.seatsInLastRow`}
                            name={`zones.${index}.seatsInLastRow`}
                            type="number"
                            min="1"
                            max={seatsPerRow || undefined}
                            placeholder="Full row"
                            value={zone.seatsInLastRow}
                            onChange={formik.handleChange}
                          />
                          <p className="text-xs text-gray-500">
                            Leave blank when the final row is full.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Layout Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Layout Preview</h3>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-gray-600">Configuration</p>
                    <p className="font-semibold text-lg">
                      {formik.values.leftSeatsPerRow}-
                      {formik.values.rightSeatsPerRow}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Seats</p>
                    <p className="font-semibold text-lg text-blue-600">
                      {totalSeats}
                    </p>
                    {zoneTotalSeats > 0 && (
                      <p className="text-xs text-gray-500">
                        Zones: {zoneTotalSeats}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-600">Seats per Row</p>
                    <p className="font-semibold text-lg">
                      {formik.values.leftSeatsPerRow +
                        formik.values.rightSeatsPerRow}
                    </p>
                  </div>
                </div>

                {/* Visual Layout Preview */}
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-3 text-center">
                    Seat Layout Example
                  </p>
                  <div className="flex justify-center">
                    <div className="space-y-1">
                      {/* Header Row */}
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <div className="w-6 text-center">Row</div>
                        {Array.from(
                          { length: formik.values.leftSeatsPerRow },
                          (_, i) => (
                            <div key={`left-${i}`} className="w-6 text-center">
                              {String.fromCharCode(65 + i)}
                            </div>
                          )
                        )}
                        <div className="w-4 text-center text-gray-400">|</div>
                        {Array.from(
                          { length: formik.values.rightSeatsPerRow },
                          (_, i) => (
                            <div key={`right-${i}`} className="w-6 text-center">
                              {String.fromCharCode(
                                65 + formik.values.leftSeatsPerRow + i
                              )}
                            </div>
                          )
                        )}
                      </div>

                      {/* Sample Rows */}
                      {[1, 2, 3].map((rowNum) => (
                        <div
                          key={rowNum}
                          className="flex items-center space-x-1"
                        >
                          <div className="w-6 text-center text-xs font-medium">
                            {rowNum}
                          </div>
                          {Array.from(
                            { length: formik.values.leftSeatsPerRow },
                            (_, i) => (
                              <div
                                key={`left-${i}`}
                                className="w-6 h-6 bg-green-100 border border-green-300 rounded text-xs flex items-center justify-center"
                              >
                                {String.fromCharCode(65 + i)}
                              </div>
                            )
                          )}
                          <div className="w-4 text-center text-xs text-gray-400">
                            │
                          </div>
                          {Array.from(
                            { length: formik.values.rightSeatsPerRow },
                            (_, i) => (
                              <div
                                key={`right-${i}`}
                                className="w-6 h-6 bg-green-100 border border-green-300 rounded text-xs flex items-center justify-center"
                              >
                                {String.fromCharCode(
                                  65 + formik.values.leftSeatsPerRow + i
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ))}

                      {formik.values.totalRows > 3 && (
                        <div className="text-center text-xs text-gray-500 py-1">
                          ... {formik.values.totalRows - 3} more rows
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={formik.isSubmitting || loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formik.isSubmitting || loading || !formik.isValid}
              >
                {formik.isSubmitting || loading ? (
                  <>
                    <SpinnerLoader size="sm" className="mr-2" />
                    {isEdit ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEdit ? "Update Seat Map" : "Create Seat Map"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatMapForm;
