import { useEffect, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  Armchair,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Crown,
  Eye,
  Plane,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';

import {
  createCabinClass,
  deleteCabinClass,
  getCabinClassById,
  updateCabinClass,
} from '@/Redux/cabinClass/cabinClassThunk';
import { clearCabinClassError } from '@/Redux/cabinClass/cabinClassSlice';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SpinnerLoader } from '@/components/common/Loader';
import { cn } from '@/lib/utils';
import { cabinClassValue } from './initialValues';

const CABIN_OPTIONS = [
  {
    value: 'ECONOMY',
    label: 'Economy',
    code: 'Y',
    description: 'High-density standard cabin for core inventory.',
    icon: Users,
    pitch: 31,
    width: 17,
    seatType: 'STANDARD',
    accent: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300',
  },
  {
    value: 'PREMIUM_ECONOMY',
    label: 'Premium Economy',
    code: 'W',
    description: 'More legroom and upgraded service between economy and business.',
    icon: Sparkles,
    pitch: 38,
    width: 19,
    seatType: 'RECLINER',
    accent: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300',
  },
  {
    value: 'BUSINESS',
    label: 'Business',
    code: 'J',
    description: 'Premium cabin for corporate and long-haul revenue.',
    icon: BriefcaseBusiness,
    pitch: 55,
    width: 21,
    seatType: 'ANGLE_FLAT',
    accent: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300',
  },
  {
    value: 'FIRST',
    label: 'First',
    code: 'F',
    description: 'Top-tier cabin with the most spacious seat product.',
    icon: Crown,
    pitch: 78,
    width: 24,
    seatType: 'LIE_FLAT',
    accent: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  },
];

const SEAT_TYPE_OPTIONS = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'RECLINER', label: 'Recliner' },
  { value: 'ANGLE_FLAT', label: 'Angle Flat' },
  { value: 'LIE_FLAT', label: 'Lie Flat' },
];

const cabinClassValidationSchema = Yup.object({
  name: Yup.string()
    .oneOf(CABIN_OPTIONS.map((option) => option.value), 'Invalid cabin class')
    .required('Cabin class is required'),
  code: Yup.string()
    .trim()
    .uppercase()
    .required('Code is required')
    .matches(/^[A-Z0-9]{1,5}$/, 'Code must be 1-5 uppercase letters or numbers'),
  description: Yup.string().max(500, 'Description must not exceed 500 characters'),
  displayOrder: Yup.number()
    .typeError('Display order must be a number')
    .integer('Display order must be a whole number')
    .min(0, 'Display order must be 0 or greater')
    .max(100, 'Display order must not exceed 100'),
  typicalSeatPitch: Yup.number()
    .typeError('Seat pitch must be a number')
    .integer('Seat pitch must be a whole number')
    .min(28, 'Seat pitch must be at least 28 inches')
    .max(84, 'Seat pitch must not exceed 84 inches')
    .nullable(),
  typicalSeatWidth: Yup.number()
    .typeError('Seat width must be a number')
    .integer('Seat width must be a whole number')
    .min(16, 'Seat width must be at least 16 inches')
    .max(26, 'Seat width must not exceed 26 inches')
    .nullable(),
  seatType: Yup.string()
    .oneOf(SEAT_TYPE_OPTIONS.map((option) => option.value), 'Invalid seat type')
    .required('Seat type is required'),
});

const toIntegerOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  return Number.parseInt(value, 10);
};

const getCabinOption = (value) => (
  CABIN_OPTIONS.find((option) => option.value === value) || CABIN_OPTIONS[0]
);

const buildInitialValues = ({ cabinClass, aircraftId, isEdit }) => {
  if (isEdit && cabinClass) {
    return {
      ...cabinClassValue,
      name: cabinClass.name || cabinClassValue.name,
      code: cabinClass.code || '',
      description: cabinClass.description || '',
      aircraftId: cabinClass.aircraftId || aircraftId || '',
      displayOrder: cabinClass.displayOrder ?? 1,
      isActive: cabinClass.isActive ?? true,
      isBookable: cabinClass.isBookable ?? true,
      typicalSeatPitch: cabinClass.typicalSeatPitch ?? '',
      typicalSeatWidth: cabinClass.typicalSeatWidth ?? '',
      seatType: cabinClass.seatType || 'STANDARD',
    };
  }

  return {
    ...cabinClassValue,
    aircraftId: aircraftId || '',
  };
};

const FieldError = ({ error, touched }) => (
  error && touched ? <p className="text-xs font-medium text-destructive">{error}</p> : null
);

const CabinClassForm = ({
  isEdit = false,
  cabinClassId = null,
  aircraftId = null,
  onSuccess,
  onCancel,
  onDelete,
  className = '',
}) => {
  const dispatch = useDispatch();
  const { loading, error, cabinClass } = useSelector((state) => state.cabinClass);

  const editingCabin = isEdit && String(cabinClass?.id) === String(cabinClassId)
    ? cabinClass
    : null;

  const initialValues = useMemo(
    () => buildInitialValues({ cabinClass: editingCabin, aircraftId, isEdit }),
    [aircraftId, editingCabin, isEdit],
  );

  useEffect(() => {
    if (isEdit && cabinClassId) {
      dispatch(getCabinClassById(cabinClassId));
    }

    return () => {
      dispatch(clearCabinClassError());
    };
  }, [dispatch, isEdit, cabinClassId]);

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: cabinClassValidationSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      dispatch(clearCabinClassError());

      const resolvedAircraftId = Number.parseInt(aircraftId || values.aircraftId, 10);
      if (!Number.isInteger(resolvedAircraftId) || resolvedAircraftId <= 0) {
        setFieldError('aircraftId', 'Aircraft is required');
        toast.error('Aircraft is required before creating a cabin class');
        setSubmitting(false);
        return;
      }

      const cabinClassData = {
        name: values.name,
        code: values.code.trim().toUpperCase(),
        description: values.description?.trim() || null,
        aircraftId: resolvedAircraftId,
        displayOrder: toIntegerOrNull(values.displayOrder) ?? 0,
        isActive: Boolean(values.isActive),
        isBookable: Boolean(values.isBookable),
        typicalSeatPitch: toIntegerOrNull(values.typicalSeatPitch),
        typicalSeatWidth: toIntegerOrNull(values.typicalSeatWidth),
        seatType: values.seatType,
      };

      try {
        const result = isEdit && cabinClassId
          ? await dispatch(updateCabinClass({ id: cabinClassId, data: cabinClassData })).unwrap()
          : await dispatch(createCabinClass(cabinClassData)).unwrap();

        toast.success(isEdit ? 'Cabin class updated successfully' : 'Cabin class created successfully');
        onSuccess?.(result);
      } catch (submitError) {
        const message = submitError || 'Unable to save cabin class';
        if (String(message).toLowerCase().includes('exist')) {
          setFieldError('code', 'This cabin code already exists for this aircraft');
        }
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const selectedCabin = getCabinOption(formik.values.name);
  const SelectedIcon = selectedCabin.icon;
  const isSaving = formik.isSubmitting || loading;

  const applyTemplate = (option) => {
    formik.setValues({
      ...formik.values,
      name: option.value,
      code: option.code,
      description: option.description,
      typicalSeatPitch: option.pitch,
      typicalSeatWidth: option.width,
      seatType: option.seatType,
    });
  };

  const handleCancel = () => {
    formik.resetForm();
    onCancel?.();
  };

  const handleDelete = async () => {
    if (!isEdit || !cabinClassId) return;

    try {
      await dispatch(deleteCabinClass(cabinClassId)).unwrap();
      toast.success('Cabin class deleted successfully');
      onDelete?.();
    } catch (deleteError) {
      toast.error(deleteError || 'Unable to delete cabin class');
    }
  };

  return (
    <div className={cn('mx-auto max-w-6xl space-y-5', className)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Plane className="h-5 w-5 text-primary" />
                  {isEdit ? 'Edit Cabin Class' : 'Create Cabin Class'}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure the cabin product used by fares, seat maps, and flight inventory.
                </p>
              </div>
              <Badge variant="outline" className="w-fit gap-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                Aircraft #{aircraftId || formik.values.aircraftId || '-'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {error && (
              <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-7">
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold">Cabin Product</h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {CABIN_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = formik.values.name === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => applyTemplate(option)}
                        className={cn(
                          'rounded-lg border p-4 text-left transition hover:border-primary/60 hover:bg-muted/40',
                          selected && 'border-primary bg-primary/5 ring-1 ring-primary/30',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-md border', option.accent)}>
                            <Icon className="h-4 w-4" />
                          </span>
                          {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="mt-3 font-medium text-foreground">{option.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{option.description}</div>
                      </button>
                    );
                  })}
                </div>
                <FieldError error={formik.errors.name} touched={formik.touched.name} />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code">Cabin Code</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formik.values.code}
                      onChange={(event) => formik.setFieldValue('code', event.target.value.toUpperCase())}
                      onBlur={formik.handleBlur}
                      maxLength={5}
                      placeholder="Y, W, J, F"
                      className={cn(formik.errors.code && formik.touched.code && 'border-destructive')}
                    />
                    <FieldError error={formik.errors.code} touched={formik.touched.code} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                      id="displayOrder"
                      name="displayOrder"
                      type="number"
                      min="0"
                      max="100"
                      value={formik.values.displayOrder}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={cn(formik.errors.displayOrder && formik.touched.displayOrder && 'border-destructive')}
                    />
                    <FieldError error={formik.errors.displayOrder} touched={formik.touched.displayOrder} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={3}
                    placeholder="Short operational description for this cabin product"
                    className={cn(formik.errors.description && formik.touched.description && 'border-destructive')}
                  />
                  <div className="flex justify-between gap-3">
                    <FieldError error={formik.errors.description} touched={formik.touched.description} />
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formik.values.description.length}/500
                    </span>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Armchair className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold">Seat Standards</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="typicalSeatPitch">Pitch (in)</Label>
                    <Input
                      id="typicalSeatPitch"
                      name="typicalSeatPitch"
                      type="number"
                      min="28"
                      max="84"
                      value={formik.values.typicalSeatPitch}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={cn(formik.errors.typicalSeatPitch && formik.touched.typicalSeatPitch && 'border-destructive')}
                    />
                    <FieldError error={formik.errors.typicalSeatPitch} touched={formik.touched.typicalSeatPitch} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="typicalSeatWidth">Width (in)</Label>
                    <Input
                      id="typicalSeatWidth"
                      name="typicalSeatWidth"
                      type="number"
                      min="16"
                      max="26"
                      value={formik.values.typicalSeatWidth}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={cn(formik.errors.typicalSeatWidth && formik.touched.typicalSeatWidth && 'border-destructive')}
                    />
                    <FieldError error={formik.errors.typicalSeatWidth} touched={formik.touched.typicalSeatWidth} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seatType">Seat Type</Label>
                    <Select
                      value={formik.values.seatType}
                      onValueChange={(value) => formik.setFieldValue('seatType', value)}
                    >
                      <SelectTrigger id="seatType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEAT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError error={formik.errors.seatType} touched={formik.touched.seatType} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold">Availability</h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
                    <div>
                      <Label htmlFor="isActive" className="font-medium">Active</Label>
                      <p className="text-xs text-muted-foreground">Visible for airline operations and configuration.</p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formik.values.isActive}
                      onCheckedChange={(checked) => formik.setFieldValue('isActive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
                    <div>
                      <Label htmlFor="isBookable" className="font-medium">Bookable</Label>
                      <p className="text-xs text-muted-foreground">Available for fares and customer inventory.</p>
                    </div>
                    <Switch
                      id="isBookable"
                      checked={formik.values.isBookable}
                      onCheckedChange={(checked) => formik.setFieldValue('isBookable', checked)}
                    />
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {isEdit && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={isSaving}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete cabin class?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes {selectedCabin.label} from this aircraft. Seat maps, fares, or inventory may block deletion if already linked.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving || !formik.isValid}>
                    {isSaving ? (
                      <>
                        <SpinnerLoader size="sm" className="mr-2" />
                        {isEdit ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {isEdit ? 'Update Cabin' : 'Create Cabin'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-primary" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={cn('rounded-lg border p-4', selectedCabin.accent)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-background/80">
                      <SelectedIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-semibold">{selectedCabin.label}</div>
                      <div className="text-xs opacity-80">Code {formik.values.code || '-'}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-background/70">
                    {formik.values.isBookable ? 'Bookable' : 'Internal'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Pitch</div>
                  <div className="mt-1 font-semibold">{formik.values.typicalSeatPitch || '-'} in</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Width</div>
                  <div className="mt-1 font-semibold">{formik.values.typicalSeatWidth || '-'} in</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Seat Type</div>
                  <div className="mt-1 font-semibold">{formik.values.seatType.replace('_', ' ')}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Order</div>
                  <div className="mt-1 font-semibold">#{formik.values.displayOrder || 0}</div>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                Cabin classes are created first. Seat maps and exact seat counts are configured after this step.
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default CabinClassForm;
