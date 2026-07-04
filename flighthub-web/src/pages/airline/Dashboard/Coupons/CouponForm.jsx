import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import {
  ArrowLeft,
  Calendar,
  Check,
  DollarSign,
  Loader2,
  Percent,
  Save,
  Tag,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { clearCoupon } from "@/Redux/coupon/couponSlice";
import { createCoupon, getCouponById, updateCoupon } from "@/Redux/coupon/couponThunk";
import { cn } from "@/lib/utils";

const today = () => new Date().toISOString().split("T")[0];
const plusDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

const cabinClasses = [
  { value: "ECONOMY", label: "Economy" },
  { value: "PREMIUM_ECONOMY", label: "Premium Economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First" },
];

const couponSchema = Yup.object({
  code: Yup.string()
    .trim()
    .required("Coupon code is required")
    .min(3, "Use at least 3 characters")
    .max(32, "Keep the code under 32 characters")
    .matches(/^[A-Z0-9_-]+$/, "Use uppercase letters, numbers, hyphens, or underscores"),
  description: Yup.string().trim().required("Description is required").max(500, "Description is too long"),
  discountType: Yup.string().oneOf(["PERCENTAGE", "FIXED_AMOUNT"]).required("Discount type is required"),
  discountValue: Yup.number()
    .typeError("Enter a valid discount")
    .required("Discount value is required")
    .positive("Discount must be greater than 0")
    .when("discountType", {
      is: "PERCENTAGE",
      then: (schema) => schema.max(100, "Percentage cannot exceed 100"),
    }),
  minPurchaseAmount: Yup.number().typeError("Enter a valid amount").min(0, "Cannot be negative").nullable(),
  maxDiscountAmount: Yup.number().typeError("Enter a valid amount").min(0, "Cannot be negative").nullable(),
  validFrom: Yup.string().required("Start date is required"),
  validUntil: Yup.string()
    .required("End date is required")
    .test("after-start", "End date must be after the start date", function (value) {
      return !value || !this.parent.validFrom || new Date(value) >= new Date(this.parent.validFrom);
    }),
  usageLimit: Yup.number()
    .typeError("Enter a valid usage limit")
    .integer("Usage limit must be a whole number")
    .min(1, "Usage limit must be at least 1")
    .required("Usage limit is required"),
  perUserLimit: Yup.number()
    .typeError("Enter a valid per-user limit")
    .integer("Per-user limit must be a whole number")
    .min(1, "Per-user limit must be at least 1")
    .max(10, "Per-user limit cannot exceed 10")
    .required("Per-user limit is required"),
});

const formatDateInput = (value, fallback = "") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString().split("T")[0];
};

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
};

const FormField = ({ id, label, required, error, touched, children, hint }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium text-foreground">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {touched && error ? (
      <p className="text-xs font-medium text-destructive">{error}</p>
    ) : hint ? (
      <p className="text-xs text-muted-foreground">{hint}</p>
    ) : null}
  </div>
);

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 border-b border-border p-4">
    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Icon className="size-4" />
    </div>
    <div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const CouponForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { coupon, createLoading, updateLoading, loading } = useSelector((store) => store.coupon);
  const [loadedId, setLoadedId] = useState(null);

  useEffect(() => {
    if (isEditMode && id) {
      dispatch(getCouponById(id));
    } else {
      dispatch(clearCoupon());
    }
    return () => dispatch(clearCoupon());
  }, [dispatch, id, isEditMode]);

  const initialValues = useMemo(
    () => ({
      code: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      minPurchaseAmount: "",
      maxDiscountAmount: "",
      validFrom: today(),
      validUntil: plusDays(30),
      usageLimit: 100,
      perUserLimit: 1,
      status: "ACTIVE",
      applicableCabinClasses: [],
      applicableRoutes: "",
    }),
    [],
  );

  const formik = useFormik({
    initialValues,
    validationSchema: couponSchema,
    onSubmit: async (values) => {
      const routeIds = String(values.applicableRoutes || "")
        .split(",")
        .map((routeId) => Number(routeId.trim()))
        .filter((routeId) => Number.isFinite(routeId) && routeId > 0);

      const payload = {
        code: values.code.trim().toUpperCase(),
        description: values.description.trim(),
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        minPurchaseAmount: toNumberOrNull(values.minPurchaseAmount),
        maxDiscountAmount: toNumberOrNull(values.maxDiscountAmount),
        validFrom: `${values.validFrom}T00:00:00`,
        validUntil: `${values.validUntil}T23:59:59`,
        usageLimit: Number(values.usageLimit),
        perUserLimit: Number(values.perUserLimit),
        status: values.status,
        applicableCabinClasses: values.applicableCabinClasses.length ? values.applicableCabinClasses : null,
        applicableRoutes: routeIds.length ? routeIds : null,
      };

      try {
        if (isEditMode) {
          await dispatch(updateCoupon({ id, data: payload })).unwrap();
          toast.success("Coupon updated");
        } else {
          await dispatch(createCoupon(payload)).unwrap();
          toast.success("Coupon created");
        }
        navigate("/airline/coupons");
      } catch (error) {
        toast.error("Unable to save coupon", { description: String(error) });
      }
    },
  });

  useEffect(() => {
    if (!isEditMode || !coupon?.id || loadedId === coupon.id) return;
    formik.setValues({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "PERCENTAGE",
      discountValue: coupon.discountValue ?? "",
      minPurchaseAmount: coupon.minPurchaseAmount ?? "",
      maxDiscountAmount: coupon.maxDiscountAmount ?? "",
      validFrom: formatDateInput(coupon.validFrom, today()),
      validUntil: formatDateInput(coupon.validUntil, plusDays(30)),
      usageLimit: coupon.usageLimit ?? 100,
      perUserLimit: coupon.perUserLimit ?? 1,
      status: coupon.status || "ACTIVE",
      applicableCabinClasses: Array.isArray(coupon.applicableCabinClasses) ? coupon.applicableCabinClasses : [],
      applicableRoutes: Array.isArray(coupon.applicableRoutes) ? coupon.applicableRoutes.join(",") : "",
    });
    setLoadedId(coupon.id);
  }, [coupon, formik, isEditMode, loadedId]);

  const isSaving = createLoading || updateLoading;
  const selectedCabins = formik.values.applicableCabinClasses;

  const toggleCabinClass = (value) => {
    const next = selectedCabins.includes(value)
      ? selectedCabins.filter((item) => item !== value)
      : [...selectedCabins, value];
    formik.setFieldValue("applicableCabinClasses", next);
  };

  const previewLabel =
    formik.values.discountType === "PERCENTAGE"
      ? `${formik.values.discountValue || 0}% off`
      : `$${formik.values.discountValue || 0} off`;

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button
            type="button"
            variant="ghost"
            className="-ml-3 mb-2"
            onClick={() => navigate("/airline/coupons")}
          >
            <ArrowLeft className="size-4" />
            Back to coupons
          </Button>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <TicketPercent className="size-4" />
            Pricing promotions
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isEditMode ? "Edit Coupon" : "Create Coupon"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Configure a controlled promo code with clear validity, redemption, and eligibility rules.
          </p>
        </div>
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">Preview</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge className="font-mono">{formik.values.code || "PROMO_CODE"}</Badge>
            <span className="text-sm font-semibold text-foreground">{previewLabel}</span>
          </div>
        </div>
      </header>

      {isEditMode && loading && !coupon ? (
        <Card className="rounded-md border-border">
          <CardContent className="flex min-h-64 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <Card className="overflow-hidden rounded-md border-border">
            <SectionHeader
              icon={Tag}
              title="Offer"
              description="Name the code and define the customer-facing discount."
            />
            <CardContent className="grid gap-4 p-4 lg:grid-cols-2">
              <FormField
                id="code"
                label="Coupon code"
                required
                touched={formik.touched.code}
                error={formik.errors.code}
                hint="Customers enter this code at checkout."
              >
                <Input
                  id="code"
                  name="code"
                  value={formik.values.code}
                  onBlur={formik.handleBlur}
                  onChange={(event) => formik.setFieldValue("code", event.target.value.toUpperCase())}
                  disabled={isEditMode}
                  placeholder="SUMMER2026"
                  className="font-mono"
                />
              </FormField>

              <FormField
                id="discountType"
                label="Discount type"
                required
                touched={formik.touched.discountType}
                error={formik.errors.discountType}
              >
                <Select
                  value={formik.values.discountType}
                  onValueChange={(value) => formik.setFieldValue("discountType", value)}
                >
                  <SelectTrigger id="discountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">
                      <span className="flex items-center gap-2"><Percent className="size-4" /> Percentage</span>
                    </SelectItem>
                    <SelectItem value="FIXED_AMOUNT">
                      <span className="flex items-center gap-2"><DollarSign className="size-4" /> Fixed amount</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <div className="lg:col-span-2">
                <FormField
                  id="description"
                  label="Description"
                  required
                  touched={formik.touched.description}
                  error={formik.errors.description}
                >
                  <Textarea
                    id="description"
                    name="description"
                    value={formik.values.description}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    rows={3}
                    placeholder="Example: Limited launch offer for selected domestic routes."
                  />
                </FormField>
              </div>

              <FormField
                id="discountValue"
                label={formik.values.discountType === "PERCENTAGE" ? "Discount percentage" : "Discount amount (USD)"}
                required
                touched={formik.touched.discountValue}
                error={formik.errors.discountValue}
              >
                <Input
                  id="discountValue"
                  name="discountValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formik.values.discountValue}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  placeholder={formik.values.discountType === "PERCENTAGE" ? "10" : "25"}
                />
              </FormField>

              <FormField
                id="maxDiscountAmount"
                label="Maximum discount cap (USD)"
                touched={formik.touched.maxDiscountAmount}
                error={formik.errors.maxDiscountAmount}
                hint="Useful for percentage discounts. Leave blank if uncapped."
              >
                <Input
                  id="maxDiscountAmount"
                  name="maxDiscountAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formik.values.maxDiscountAmount}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  placeholder="Optional"
                />
              </FormField>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-md border-border">
            <SectionHeader
              icon={Calendar}
              title="Redemption controls"
              description="Set when the code can be used and how many redemptions are allowed."
            />
            <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField
                id="validFrom"
                label="Valid from"
                required
                touched={formik.touched.validFrom}
                error={formik.errors.validFrom}
              >
                <Input
                  id="validFrom"
                  name="validFrom"
                  type="date"
                  value={formik.values.validFrom}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
              </FormField>

              <FormField
                id="validUntil"
                label="Valid until"
                required
                touched={formik.touched.validUntil}
                error={formik.errors.validUntil}
              >
                <Input
                  id="validUntil"
                  name="validUntil"
                  type="date"
                  value={formik.values.validUntil}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
              </FormField>

              <FormField
                id="usageLimit"
                label="Total usage limit"
                required
                touched={formik.touched.usageLimit}
                error={formik.errors.usageLimit}
              >
                <Input
                  id="usageLimit"
                  name="usageLimit"
                  type="number"
                  min="1"
                  value={formik.values.usageLimit}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
              </FormField>

              <FormField
                id="perUserLimit"
                label="Per-user limit"
                required
                touched={formik.touched.perUserLimit}
                error={formik.errors.perUserLimit}
              >
                <Input
                  id="perUserLimit"
                  name="perUserLimit"
                  type="number"
                  min="1"
                  max="10"
                  value={formik.values.perUserLimit}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField
                  id="minPurchaseAmount"
                  label="Minimum booking amount (USD)"
                  touched={formik.touched.minPurchaseAmount}
                  error={formik.errors.minPurchaseAmount}
                  hint="Leave blank to allow any booking amount."
                >
                  <Input
                    id="minPurchaseAmount"
                    name="minPurchaseAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formik.values.minPurchaseAmount}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    placeholder="Optional"
                  />
                </FormField>
              </div>

              {isEditMode && (
                <div className="md:col-span-2">
                  <FormField id="status" label="Operational status">
                    <Select value={formik.values.status} onValueChange={(value) => formik.setFieldValue("status", value)}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-md border-border">
            <SectionHeader
              icon={Users}
              title="Eligibility"
              description="Restrict a coupon to specific cabin classes or routes when needed."
            />
            <CardContent className="space-y-5 p-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Cabin classes</Label>
                <p className="mt-1 text-xs text-muted-foreground">No selection means the code applies to every cabin.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {cabinClasses.map((cabin) => {
                    const selected = selectedCabins.includes(cabin.value);
                    return (
                      <button
                        key={cabin.value}
                        type="button"
                        onClick={() => toggleCabinClass(cabin.value)}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:bg-muted",
                        )}
                      >
                        {selected ? <Check className="size-4" /> : <X className="size-4 text-muted-foreground" />}
                        {cabin.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <FormField
                id="applicableRoutes"
                label="Route IDs"
                hint="Optional comma-separated route IDs. Leave blank for all routes."
              >
                <Input
                  id="applicableRoutes"
                  name="applicableRoutes"
                  value={formik.values.applicableRoutes}
                  onChange={formik.handleChange}
                  placeholder="Example: 1, 2, 3"
                />
              </FormField>
            </CardContent>
          </Card>

          <div className="sticky bottom-0 z-10 -mx-2 border-t border-border bg-background/95 px-2 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isEditMode ? "Ready to update this coupon?" : "Ready to create this coupon?"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Coupon API must be available in backend for this action to complete.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => navigate("/airline/coupons")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {isEditMode ? "Update coupon" : "Create coupon"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CouponForm;
