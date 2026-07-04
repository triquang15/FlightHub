import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SpinnerLoader } from "@/components/common/Loader";
import {
  createAncillary,
  getAncillaryById,
  updateAncillary,
} from "@/Redux/ancillary/ancillaryThunk";
import { clearAncillaryError, clearCurrentAncillary } from "@/Redux/ancillary/ancillarySlice";
import { toast } from "sonner";

const ANCILLARY_TYPES = [
  { value: "BAGGAGE", label: "Baggage" },
 
  
{
  value:"TRAVEL_PROTECTION",
  label:"Travel Protection"
},
 
];

const BAGGAGE_CATEGORIES = [
  { value: "CHECKED", label: "Checked Baggage" },
  { value: "CABIN", label: "Cabin Baggage" },
  { value: "SPORTS", label: "Sports Equipment" },
  { value: "OVERSIZED", label: "Oversized Baggage" },
  { value: "SPECIAL", label: "Special Baggage" },
];

const WEIGHT_UNITS = [
  { value: "KG", label: "Kilograms (KG)" },
  { value: "LB", label: "Pounds (LB)" },
];

const validationSchema = Yup.object({
  type: Yup.string().required("Type is required"),
  name: Yup.string().required("Name is required").max(200),
  subType: Yup.string().max(100),
  rfisc: Yup.string().max(10),
  description: Yup.string().max(1000),
  displayOrder: Yup.number().integer().min(0),
});

const AncillaryForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { ancillary, loading } = useSelector((state) => state.ancillary);

  const formik = useFormik({
    initialValues: {
      type: "",
      subType: "",
      rfisc: "",
      name: "",
      description: "",
      displayOrder: 0,
      metadata: {
        baggage: {
          weight: null,
          unit: "KG",
          pieces: null,
          category: "",
          dimensions: "",
          notes: "",
        },
        protectionSummary: "",
        specialServiceDetails: "",
      },
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Clean metadata based on type
        const payload = { ...values };

        if (values.type === "BAGGAGE") {
          // Keep only baggage metadata
          payload.metadata = {
            baggage: values.metadata.baggage,
          };
        } else if (values.type === "TRAVEL_PROTECTION") {
          // Keep only protection summary
          payload.metadata = {
            protectionSummary: values.metadata.protectionSummary,
          };
        } else if (values.type === "SPECIAL_SERVICE") {
          // Keep only special service details
          payload.metadata = {
            specialServiceDetails: values.metadata.specialServiceDetails,
          };
        } else {
          // No metadata for other types
          payload.metadata = null;
        }

        const saved = isEditMode
          ? await dispatch(updateAncillary({ id, data: payload })).unwrap()
          : await dispatch(createAncillary(payload)).unwrap();
        toast.success(isEditMode ? "Ancillary updated" : "Ancillary created", {
          description: `${saved?.name || payload.name} is ready in the master catalog.`,
        });
        navigate("/airline/ancillaries");
      } catch (error) {
        toast.error(isEditMode ? "Unable to update ancillary" : "Unable to create ancillary", {
          description: String(error),
        });
      }
    },
  });

  useEffect(() => {
    dispatch(clearAncillaryError());
    dispatch(clearCurrentAncillary());
    if (isEditMode && id) {
      dispatch(getAncillaryById(id));
    }
    return () => {
      dispatch(clearAncillaryError());
      dispatch(clearCurrentAncillary());
    };
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && ancillary) {
      formik.setValues({
        type: ancillary.type || "",
        subType: ancillary.subType || "",
        rfisc: ancillary.rfisc || "",
        name: ancillary.name || "",
        description: ancillary.description || "",
        displayOrder: ancillary.displayOrder || 0,
        metadata: {
          baggage: ancillary.metadata?.baggage || {
            weight: null,
            unit: "KG",
            pieces: null,
            category: "",
            dimensions: "",
            notes: "",
          },
          protectionSummary: ancillary.metadata?.protectionSummary || "",
          specialServiceDetails:
            ancillary.metadata?.specialServiceDetails || "",
        },
      });
    }
  }, [ancillary, isEditMode]);

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to master ancillaries"
          onClick={() => navigate("/airline/ancillaries")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex min-w-0 gap-4">
          <div className="hidden size-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary sm:flex">
            <Package className="h-6 w-6" />
          </div>
          <div>
          <p className="mb-1 text-sm font-medium text-primary">Service catalog</p>
          <h1 className="text-2xl font-semibold text-foreground">
            {isEditMode ? "Edit Ancillary" : "Create Ancillary"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {isEditMode
              ? "Update ancillary details"
              : "Add a new ancillary service to your catalog"}
          </p>
          </div>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={formik.handleSubmit}>
        <Card className="rounded-md border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Ancillary Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  className="w-full"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., Extra Checked Bag 23kg"
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-sm text-destructive">{formik.errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formik.values.type}
                  onValueChange={(value) => formik.setFieldValue("type", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANCILLARY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.type && formik.errors.type && (
                  <p className="text-sm text-destructive">{formik.errors.type}</p>
                )}
              </div>
            </div>

            {/* Sub-type & RFISC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sub-type</Label>
                <Input
                  className="w-full"
                  name="subType"
                  value={formik.values.subType}
                  onChange={formik.handleChange}
                  placeholder="e.g., CHECKED, SPORTS_EQUIPMENT"
                />
              </div>

              <div className="space-y-2">
                <Label>RFISC Code</Label>
                <Input
                  className="w-full"
                  name="rfisc"
                  value={formik.values.rfisc}
                  onChange={formik.handleChange}
                  placeholder="e.g., 0CC, 0CD"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                className="w-full"
                type="number"
                name="displayOrder"
                value={formik.values.displayOrder}
                onChange={formik.handleChange}
                placeholder="0"
                min="0"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                className="w-full"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                placeholder="Detailed description of the ancillary service"
                rows={4}
                maxLength={1000}
              />
              <p className="text-sm text-muted-foreground">
                {formik.values.description.length}/1000 characters
              </p>
            </div>

            {/* BAGGAGE METADATA - Show only if type is BAGGAGE */}
            {formik.values.type === "BAGGAGE" && (
              <Card className="rounded-md border-border bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">Baggage Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Weight</Label>
                      <Input
                        className="w-full"
                        type="number"
                        name="metadata.baggage.weight"
                        value={formik.values.metadata.baggage.weight || ""}
                        onChange={formik.handleChange}
                        placeholder="e.g., 3, 5, 10"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select
                        value={formik.values.metadata.baggage.unit}
                        onValueChange={(value) =>
                          formik.setFieldValue("metadata.baggage.unit", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {WEIGHT_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Pieces</Label>
                      <Input
                        className="w-full"
                        type="number"
                        name="metadata.baggage.pieces"
                        value={formik.values.metadata.baggage.pieces || ""}
                        onChange={formik.handleChange}
                        placeholder="e.g., 1, 2"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of pieces (optional)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={formik.values.metadata.baggage.category}
                        onValueChange={(value) =>
                          formik.setFieldValue(
                            "metadata.baggage.category",
                            value
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {BAGGAGE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Dimensions</Label>
                      <Input
                        className="w-full"
                        name="metadata.baggage.dimensions"
                        value={formik.values.metadata.baggage.dimensions || ""}
                        onChange={formik.handleChange}
                        placeholder="e.g., 55x35x25 cm or 158 cm linear"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      className="w-full"
                      name="metadata.baggage.notes"
                      value={formik.values.metadata.baggage.notes || ""}
                      onChange={formik.handleChange}
                      placeholder="Additional notes (e.g., 'Golf clubs', 'Surfboard', 'Musical instrument')"
                      rows={2}
                      maxLength={500}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TRAVEL PROTECTION METADATA */}
            {formik.values.type === "TRAVEL_PROTECTION" && (
              <Card className="rounded-md border-border bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">Protection Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Coverage Summary</Label>
                    <Textarea
                      className="w-full"
                      name="metadata.protectionSummary"
                      value={formik.values.metadata.protectionSummary || ""}
                      onChange={formik.handleChange}
                      placeholder="e.g., Trip cancellation, baggage loss, medical coverage up to USD 5,000"
                      rows={3}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Brief summary of protection coverage
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SPECIAL SERVICE METADATA */}
            {formik.values.type === "SPECIAL_SERVICE" && (
              <Card className="rounded-md border-border bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">Service Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Service Details</Label>
                    <Textarea
                      className="w-full"
                      name="metadata.specialServiceDetails"
                      value={formik.values.metadata.specialServiceDetails || ""}
                      onChange={formik.handleChange}
                      placeholder="e.g., Pet transport in cabin, max 8kg including carrier"
                      rows={3}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Detailed information about the special service
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="mt-5 flex items-center justify-between rounded-md border border-border bg-card/95 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/airline/ancillaries")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formik.isValid}
          >
            {loading ? (
              <>
                <SpinnerLoader size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Update" : "Create"} Ancillary
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AncillaryForm;
