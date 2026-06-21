import { useEffect, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  Armchair,
  Columns3,
  Grid3X3,
  Plus,
  Rows3,
  Save,
  Trash2,
} from "lucide-react";

import {
  createSeatMap,
  getSeatMapsByCabinClass,
  updateSeatMap,
} from "@/Redux/SeatMap/seatMapThunk";
import { clearCurrentSeatMap, clearSeatMapError } from "@/Redux/SeatMap/seatMapSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpinnerLoader } from "@/components/common/Loader";
import { cn } from "@/lib/utils";
import { seatMapValues } from "./seatMapValue";

const layoutPresets = [
  { label: "Narrow body", left: 3, right: 3, rows: 30 },
  { label: "Regional", left: 2, right: 2, rows: 20 },
  { label: "Premium cabin", left: 1, right: 2, rows: 8 },
  { label: "Wide body", left: 3, right: 4, rows: 42 },
];

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toIntegerOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number.parseInt(value, 10);
};

const getZoneSeatCount = (zone) => {
  const rows = Math.max(0, toNumber(zone.endRow) - toNumber(zone.startRow) + 1);
  const seatsPerRow = toNumber(zone.leftSeatsPerRow) + toNumber(zone.rightSeatsPerRow);
  if (!rows || !seatsPerRow) return 0;

  const partialLastRow = toIntegerOrNull(zone.seatsInLastRow);
  return rows * seatsPerRow - (partialLastRow ? seatsPerRow - partialLastRow : 0);
};

const buildFullZone = (values) => ({
  name: "Main cabin",
  startRow: 1,
  endRow: toNumber(values.totalRows, 1),
  leftSeatsPerRow: toNumber(values.leftSeatsPerRow, 1),
  rightSeatsPerRow: toNumber(values.rightSeatsPerRow, 1),
  seatsInLastRow: "",
  displayOrder: 1,
});

const normalizeZones = (zones, fallbackValues) => {
  const source = zones?.length ? zones : [buildFullZone(fallbackValues)];
  return source.map((zone, index) => ({
    name: zone.name || `Zone ${index + 1}`,
    startRow: zone.startRow ?? 1,
    endRow: zone.endRow ?? fallbackValues.totalRows,
    leftSeatsPerRow: zone.leftSeatsPerRow ?? fallbackValues.leftSeatsPerRow,
    rightSeatsPerRow: zone.rightSeatsPerRow ?? fallbackValues.rightSeatsPerRow,
    seatsInLastRow: zone.seatsInLastRow ?? "",
    displayOrder: zone.displayOrder ?? index + 1,
  }));
};

const buildInitialValues = (seatMap, cabinClassId) => {
  if (!seatMap) {
    return {
      ...seatMapValues,
      cabinClassId: cabinClassId || "",
      zones: normalizeZones(seatMapValues.zones, seatMapValues),
    };
  }

  const base = {
    name: seatMap.name || "",
    totalRows: seatMap.totalRows || 12,
    leftSeatsPerRow: seatMap.leftSeatsPerRow || 3,
    rightSeatsPerRow: seatMap.rightSeatsPerRow || 3,
    cabinClassId: seatMap.cabinClassId || cabinClassId || "",
  };

  return {
    ...base,
    zones: normalizeZones(seatMap.zones, base),
  };
};

const seatMapValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters"),
  totalRows: Yup.number()
    .typeError("Total rows must be a number")
    .required("Total rows is required")
    .integer("Must be a whole number")
    .min(1, "Must have at least 1 row")
    .max(100, "Cannot exceed 100 rows"),
  leftSeatsPerRow: Yup.number()
    .typeError("Left seats must be a number")
    .required("Left seats per row is required")
    .integer("Must be a whole number")
    .min(1, "Must have at least 1 seat")
    .max(10, "Cannot exceed 10 seats per side"),
  rightSeatsPerRow: Yup.number()
    .typeError("Right seats must be a number")
    .required("Right seats per row is required")
    .integer("Must be a whole number")
    .min(1, "Must have at least 1 seat")
    .max(10, "Cannot exceed 10 seats per side"),
  zones: Yup.array()
    .of(
      Yup.object({
        name: Yup.string().trim().required("Zone name is required"),
        startRow: Yup.number().typeError("Start row must be a number").required("Start row is required").integer().min(1),
        endRow: Yup.number().typeError("End row must be a number").required("End row is required").integer().min(1),
        leftSeatsPerRow: Yup.number().typeError("Left seats must be a number").required("Left seats is required").integer().min(0).max(10),
        rightSeatsPerRow: Yup.number().typeError("Right seats must be a number").required("Right seats is required").integer().min(0).max(10),
        seatsInLastRow: Yup.mixed().test(
          "valid-partial-last-row",
          "Partial last row must be between 1 and seats per row",
          function validatePartialRow(value) {
            if (value === "" || value === null || value === undefined) return true;
            const seatsPerRow = toNumber(this.parent.leftSeatsPerRow) + toNumber(this.parent.rightSeatsPerRow);
            const numericValue = Number(value);
            return Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= seatsPerRow;
          },
        ),
      }),
    )
    .min(1, "At least one zone is required")
    .test("valid-zone-business-rules", "Zones overlap or exceed total rows", function validateZones(zones) {
      const totalRows = toNumber(this.parent.totalRows);
      const orderedZones = [...(zones || [])].sort((left, right) => toNumber(left.startRow) - toNumber(right.startRow));
      let previousEndRow = 0;

      for (const zone of orderedZones) {
        const startRow = toNumber(zone.startRow);
        const endRow = toNumber(zone.endRow);
        const seatsPerRow = toNumber(zone.leftSeatsPerRow) + toNumber(zone.rightSeatsPerRow);

        if (endRow < startRow || endRow > totalRows || seatsPerRow <= 0 || startRow <= previousEndRow) {
          return false;
        }
        previousEndRow = endRow;
      }

      return true;
    }),
});

const FieldError = ({ error, touched }) => (
  error && touched ? <p className="text-xs font-medium text-destructive">{error}</p> : null
);

const SeatPreview = ({ values }) => {
  const zones = normalizeZones(values.zones, values);
  const maxRows = Math.min(toNumber(values.totalRows, 0), 10);
  const maxSeatsPerRow = Math.min(toNumber(values.leftSeatsPerRow) + toNumber(values.rightSeatsPerRow), 10);
  const rows = Array.from({ length: maxRows }, (_, index) => index + 1);

  const zoneForRow = (row) => zones.find((zone) => row >= toNumber(zone.startRow) && row <= toNumber(zone.endRow));

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Generated Preview</div>
          <div className="text-xs text-muted-foreground">First {maxRows || 0} rows based on zone rules</div>
        </div>
        <Badge variant="outline">{maxSeatsPerRow} seats/row max</Badge>
      </div>
      <div className="max-w-full overflow-x-auto pb-1">
        <div className="min-w-max space-y-1">
          {rows.map((row) => {
            const zone = zoneForRow(row);
            const leftSeats = toNumber(zone?.leftSeatsPerRow, values.leftSeatsPerRow);
            const rightSeats = toNumber(zone?.rightSeatsPerRow, values.rightSeatsPerRow);
            const isLastZoneRow = zone && row === toNumber(zone.endRow) && zone.seatsInLastRow;
            const configuredSeats = isLastZoneRow
              ? toNumber(zone.seatsInLastRow)
              : leftSeats + rightSeats;

            return (
              <div key={row} className="flex items-center gap-1 text-xs">
                <div className="w-8 shrink-0 text-right font-medium text-muted-foreground">{row}</div>
                {Array.from({ length: configuredSeats }, (_, index) => {
                  const isAisleBreak = index === leftSeats;
                  return (
                    <div key={`${row}-${index}`} className="flex items-center gap-1">
                      {isAisleBreak && <div className="w-4" />}
                      <div className="flex h-6 w-6 items-center justify-center rounded border border-emerald-300 bg-emerald-50 text-[10px] font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {String.fromCharCode(65 + index)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SeatMapForm = ({
  isEdit = false,
  seatMapId = null,
  cabinClassId = null,
  cabinClass = null,
  onSuccess,
  onCancel,
  className = "",
}) => {
  const dispatch = useDispatch();
  const params = useParams();
  const resolvedCabinId = cabinClassId || params.cabinId;
  const { loading, error, seatMap } = useSelector((state) => state.seatMap || {});

  useEffect(() => {
    if (isEdit && resolvedCabinId) {
      dispatch(getSeatMapsByCabinClass(resolvedCabinId));
    }

    return () => {
      dispatch(clearSeatMapError());
      if (!isEdit) dispatch(clearCurrentSeatMap());
    };
  }, [dispatch, isEdit, resolvedCabinId]);

  const editSeatMap = isEdit && seatMap && (!seatMapId || String(seatMap.id) === String(seatMapId))
    ? seatMap
    : null;

  const formInitialValues = useMemo(
    () => buildInitialValues(editSeatMap, resolvedCabinId),
    [editSeatMap, resolvedCabinId],
  );

  const formik = useFormik({
    initialValues: formInitialValues,
    enableReinitialize: true,
    validationSchema: seatMapValidationSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      dispatch(clearSeatMapError());

      const numericCabinId = Number.parseInt(resolvedCabinId, 10);
      if (!Number.isInteger(numericCabinId) || numericCabinId <= 0) {
        toast.error("Cabin class is required before creating a seat map");
        setSubmitting(false);
        return;
      }

      const cleanedZones = normalizeZones(values.zones, values).map((zone, index) => ({
        name: zone.name.trim(),
        startRow: toNumber(zone.startRow),
        endRow: toNumber(zone.endRow),
        leftSeatsPerRow: toNumber(zone.leftSeatsPerRow),
        rightSeatsPerRow: toNumber(zone.rightSeatsPerRow),
        seatsInLastRow: toIntegerOrNull(zone.seatsInLastRow),
        displayOrder: index + 1,
      }));

      const seatMapData = {
        name: values.name.trim(),
        totalRows: toNumber(values.totalRows),
        leftSeatsPerRow: toNumber(values.leftSeatsPerRow),
        rightSeatsPerRow: toNumber(values.rightSeatsPerRow),
        cabinClassId: numericCabinId,
        zones: cleanedZones,
      };

      try {
        const result = isEdit && editSeatMap
          ? await dispatch(updateSeatMap({ id: editSeatMap.id, data: seatMapData })).unwrap()
          : await dispatch(createSeatMap(seatMapData)).unwrap();

        toast.success(isEdit ? "Seat map updated successfully" : "Seat map created successfully");
        onSuccess?.(result);
      } catch (submitError) {
        const message = submitError || "Unable to save seat map";
        if (String(message).toLowerCase().includes("exist")) {
          setFieldError("name", "This seat map name already exists for this cabin");
        }
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const zones = normalizeZones(formik.values.zones, formik.values);
  const totalSeats = zones.reduce((sum, zone) => sum + getZoneSeatCount(zone), 0);
  const baselineSeats = toNumber(formik.values.totalRows) * (toNumber(formik.values.leftSeatsPerRow) + toNumber(formik.values.rightSeatsPerRow));
  const coveredRows = new Set();
  zones.forEach((zone) => {
    for (let row = toNumber(zone.startRow); row <= toNumber(zone.endRow); row += 1) {
      coveredRows.add(row);
    }
  });
  const uncoveredRows = Math.max(0, toNumber(formik.values.totalRows) - coveredRows.size);
  const isSaving = formik.isSubmitting || loading;

  const applyPreset = (preset) => {
    const nextValues = {
      ...formik.values,
      name: formik.values.name || `${cabinClass?.name || "Cabin"} ${preset.label} Seat Map`,
      totalRows: preset.rows,
      leftSeatsPerRow: preset.left,
      rightSeatsPerRow: preset.right,
    };

    formik.setValues({
      ...nextValues,
      zones: [buildFullZone(nextValues)],
    });
  };

  const resetToFullZone = () => {
    formik.setFieldValue("zones", [buildFullZone(formik.values)]);
  };

  const addZone = () => {
    const orderedZones = [...zones].sort((left, right) => toNumber(left.endRow) - toNumber(right.endRow));
    const previousEndRow = toNumber(orderedZones[orderedZones.length - 1]?.endRow);
    const nextStartRow = Math.min(previousEndRow + 1, toNumber(formik.values.totalRows));
    const nextEndRow = toNumber(formik.values.totalRows);

    formik.setFieldValue("zones", [
      ...zones,
      {
        name: `Zone ${zones.length + 1}`,
        startRow: nextStartRow || 1,
        endRow: nextEndRow || nextStartRow || 1,
        leftSeatsPerRow: formik.values.leftSeatsPerRow,
        rightSeatsPerRow: formik.values.rightSeatsPerRow,
        seatsInLastRow: "",
        displayOrder: zones.length + 1,
      },
    ]);
  };

  const removeZone = (index) => {
    const nextZones = zones.filter((_, zoneIndex) => zoneIndex !== index);
    formik.setFieldValue("zones", nextZones.length ? nextZones : [buildFullZone(formik.values)]);
  };

  const handleCancel = () => {
    formik.resetForm();
    onCancel?.();
  };

  return (
    <div className={cn("mx-auto max-w-6xl space-y-5", className)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Grid3X3 className="h-5 w-5 text-primary" />
                  {isEdit ? "Edit Seat Map" : "Create Seat Map"}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Define the row template used to generate physical seats for this cabin.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                Cabin #{resolvedCabinId || "-"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {error && (
              <div className="mb-5 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-7">
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Armchair className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold">Template</h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {layoutPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="rounded-lg border p-3 text-left transition hover:border-primary/60 hover:bg-muted/40"
                    >
                      <div className="font-medium">{preset.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {preset.rows} rows, {preset.left}-{preset.right} layout
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Seat Map Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Economy A320 3-3 Layout"
                    className={cn(formik.errors.name && formik.touched.name && "border-destructive")}
                  />
                  <FieldError error={formik.errors.name} touched={formik.touched.name} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Columns3 className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold">Base Layout</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="totalRows">Total Rows</Label>
                    <Input
                      id="totalRows"
                      name="totalRows"
                      type="number"
                      min="1"
                      max="100"
                      value={formik.values.totalRows}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={cn(formik.errors.totalRows && formik.touched.totalRows && "border-destructive")}
                    />
                    <FieldError error={formik.errors.totalRows} touched={formik.touched.totalRows} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leftSeatsPerRow">Left Block</Label>
                    <Input
                      id="leftSeatsPerRow"
                      name="leftSeatsPerRow"
                      type="number"
                      min="1"
                      max="10"
                      value={formik.values.leftSeatsPerRow}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={cn(formik.errors.leftSeatsPerRow && formik.touched.leftSeatsPerRow && "border-destructive")}
                    />
                    <FieldError error={formik.errors.leftSeatsPerRow} touched={formik.touched.leftSeatsPerRow} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rightSeatsPerRow">Right Block</Label>
                    <Input
                      id="rightSeatsPerRow"
                      name="rightSeatsPerRow"
                      type="number"
                      min="1"
                      max="10"
                      value={formik.values.rightSeatsPerRow}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={cn(formik.errors.rightSeatsPerRow && formik.touched.rightSeatsPerRow && "border-destructive")}
                    />
                    <FieldError error={formik.errors.rightSeatsPerRow} touched={formik.touched.rightSeatsPerRow} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Rows3 className="h-4 w-4 text-primary" />
                    <div>
                      <h2 className="text-base font-semibold">Row Zones</h2>
                      <p className="text-xs text-muted-foreground">
                        Zones generate seats. Rows outside zones will not have seats.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={resetToFullZone}>
                      Full Cabin
                    </Button>
                    <Button type="button" variant="outline" onClick={addZone}>
                      <Plus className="h-4 w-4" />
                      Zone
                    </Button>
                  </div>
                </div>

                {formik.errors.zones && typeof formik.errors.zones === "string" && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {formik.errors.zones}
                  </p>
                )}

                {uncoveredRows > 0 && (
                  <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                    {uncoveredRows} row(s) are outside all zones. The backend will not generate seats for those rows.
                  </p>
                )}

                <div className="space-y-3">
                  {zones.map((zone, index) => {
                    const seatsPerRow = toNumber(zone.leftSeatsPerRow) + toNumber(zone.rightSeatsPerRow);
                    const zoneSeats = getZoneSeatCount(zone);

                    return (
                      <div key={index} className="rounded-lg border bg-card p-4">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-foreground">{zone.name || `Zone ${index + 1}`}</div>
                            <div className="text-xs text-muted-foreground">
                              Rows {zone.startRow || "-"}-{zone.endRow || "-"} - {zoneSeats} seats
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove zone"
                            onClick={() => removeZone(index)}
                            disabled={zones.length === 1}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-6">
                          <div className="space-y-2 md:col-span-2">
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
                              max="10"
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
                              max="10"
                              value={zone.rightSeatsPerRow}
                              onChange={formik.handleChange}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={`zones.${index}.seatsInLastRow`}>Partial Last Row</Label>
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
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving || !formik.isValid}>
                  {isSaving ? (
                    <>
                      <SpinnerLoader size="sm" className="mr-2" />
                      {isEdit ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isEdit ? "Update Seat Map" : "Create Seat Map"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Capacity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Generated Seats</div>
                  <div className="mt-1 text-2xl font-semibold">{totalSeats}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Baseline</div>
                  <div className="mt-1 text-2xl font-semibold">{baselineSeats}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Zones</div>
                  <div className="mt-1 text-2xl font-semibold">{zones.length}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Uncovered</div>
                  <div className="mt-1 text-2xl font-semibold">{uncoveredRows}</div>
                </div>
              </div>
              <SeatPreview values={formik.values} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default SeatMapForm;
