import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Armchair, CircleDollarSign, Plane, Save, ShieldCheck, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { clearCurrentFare } from "@/Redux/fare/fareSlice";
import { createFare, getOwnedFareById, updateFare } from "@/Redux/fare/fareThunk";
import { getCabinClassesByAircraft } from "@/Redux/cabinClass/cabinClassThunk";
import { getFlightsByAirline } from "@/Redux/flight/flightThunk";

const emptyForm = {
  name: "", rbdCode: "", fareLabel: "", flightId: "", cabinClassId: "",
  currency: "USD",
  baseFare: "", taxesAndFees: "0", airlineFees: "0",
  extraSeatSpace: false, preferredSeatChoice: false, advanceSeatSelection: false,
  guaranteedSeatTogether: false, priorityBoarding: false, priorityCheckin: false,
  fastTrackSecurity: false, complimentaryMeals: false, premiumMealChoice: false,
  inFlightInternet: false, inFlightEntertainment: false, complimentaryBeverages: false,
  freeDateChange: false, partialRefund: false, fullRefund: false,
  loungeAccess: false, airportTransfer: false,
};

const benefitGroups = [
  {
    title: "Seat experience", icon: Armchair,
    fields: [["extraSeatSpace", "Extra seat space"], ["preferredSeatChoice", "Preferred seat choice"], ["advanceSeatSelection", "Advance seat selection"], ["guaranteedSeatTogether", "Guaranteed seats together"]],
  },
  {
    title: "Airport priority", icon: Plane,
    fields: [["priorityBoarding", "Priority boarding"], ["priorityCheckin", "Priority check-in"], ["fastTrackSecurity", "Fast-track security"]],
  },
  {
    title: "In-flight service", icon: Sparkles,
    fields: [["complimentaryMeals", "Complimentary meals"], ["premiumMealChoice", "Premium meal choice"], ["inFlightInternet", "In-flight internet"], ["inFlightEntertainment", "Entertainment"], ["complimentaryBeverages", "Complimentary beverages"]],
  },
  {
    title: "Flexibility", icon: ShieldCheck,
    fields: [["freeDateChange", "Free date change"], ["partialRefund", "Partial refund"], ["fullRefund", "Full refund"], ["loungeAccess", "Lounge access"], ["airportTransfer", "Airport transfer"]],
  },
];

const toForm = (fare) => ({
  ...emptyForm,
  ...Object.fromEntries(Object.keys(emptyForm).map((key) => [key, fare?.[key] ?? emptyForm[key]])),
  flightId: fare?.flightId ? String(fare.flightId) : "",
  cabinClassId: fare?.cabinClassId ? String(fare.cabinClassId) : "",
  rbdCode: String(fare?.rbdCode || ""),
});

const FareManagementForm = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fare, loading } = useSelector((state) => state.fare);
  const flightPayload = useSelector((state) => state.flight.flights);
  const cabinPayload = useSelector((state) => state.cabinClass.cabinClasses);
  const [form, setForm] = useState(() => editing ? emptyForm : {
    ...emptyForm,
    flightId: searchParams.get("flightId") || "",
    cabinClassId: searchParams.get("cabinClassId") || "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const flights = useMemo(() => Array.isArray(flightPayload) ? flightPayload : (flightPayload?.content || []), [flightPayload]);
  const cabins = useMemo(() => Array.isArray(cabinPayload) ? cabinPayload : (cabinPayload?.content || []), [cabinPayload]);
  const selectedFlight = flights.find((flight) => String(flight.id) === form.flightId);
  const total = [form.baseFare, form.taxesAndFees, form.airlineFees]
    .reduce((sum, value) => sum + (Number(value) || 0), 0);

  useEffect(() => {
    dispatch(getFlightsByAirline());
    if (editing) dispatch(getOwnedFareById(id));
    return () => dispatch(clearCurrentFare());
  }, [dispatch, editing, id]);

  useEffect(() => {
    if (editing && fare && String(fare.id) === String(id)) {
      // Hydrate the editable draft when the owner-scoped API request completes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(toForm(fare));
    }
  }, [editing, fare, id]);

  useEffect(() => {
    if (selectedFlight?.aircraft?.id) dispatch(getCabinClassesByAircraft(selectedFlight.aircraft.id));
  }, [dispatch, selectedFlight?.aircraft?.id]);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const changeFlight = (flightId) => {
    setForm((current) => ({ ...current, flightId, cabinClassId: "" }));
    setErrors((current) => ({ ...current, flightId: undefined, cabinClassId: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.flightId) next.flightId = "Select a flight.";
    if (!form.cabinClassId) next.cabinClassId = "Select a cabin class.";
    if (!form.name.trim()) next.name = "Fare name is required.";
    if (!/^[A-Za-z]$/.test(form.rbdCode)) next.rbdCode = "Use one alphabetic RBD character.";
    if (!(Number(form.baseFare) > 0)) next.baseFare = "Base fare must be greater than zero.";
    if (Number(form.taxesAndFees) < 0) next.taxesAndFees = "Taxes cannot be negative.";
    if (Number(form.airlineFees) < 0) next.airlineFees = "Airline fees cannot be negative.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    const payload = {
      ...form,
      name: form.name.trim(),
      fareLabel: form.fareLabel.trim() || null,
      rbdCode: form.rbdCode.toUpperCase(),
      flightId: Number(form.flightId),
      cabinClassId: Number(form.cabinClassId),
      baseFare: Number(form.baseFare),
      taxesAndFees: Number(form.taxesAndFees || 0),
      airlineFees: Number(form.airlineFees || 0),
    };

    setSubmitting(true);
    try {
      const saved = editing
        ? await dispatch(updateFare({ id, fareData: payload })).unwrap()
        : await dispatch(createFare(payload)).unwrap();
      toast.success(editing ? "Fare updated" : "Fare created", { description: `${saved.name} is ready for commercial configuration.` });
      navigate(`/airline/fares/${saved.id}`);
    } catch (submitError) {
      toast.error(editing ? "Unable to update fare" : "Unable to create fare", { description: String(submitError) });
    } finally {
      setSubmitting(false);
    }
  };

  if (editing && loading && (!fare || String(fare.id) !== String(id))) {
    return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-96" /></div>;
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button type="button" variant="ghost" size="sm" className="mb-2 -ml-3" onClick={() => navigate(-1)}><ArrowLeft className="size-4" /> Back</Button>
          <h1 className="text-2xl font-semibold text-foreground">{editing ? "Edit fare" : "Create fare"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Define the sellable price and included cabin benefits.</p>
        </div>
        <Button type="submit" disabled={submitting}><Save className="size-4" /> {submitting ? "Saving..." : "Save fare"}</Button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plane className="size-4" /> Flight and cabin</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Flight</Label>
                <Select value={form.flightId} onValueChange={changeFlight}>
                  <SelectTrigger aria-invalid={Boolean(errors.flightId)}><SelectValue placeholder="Select flight" /></SelectTrigger>
                  <SelectContent>{flights.map((flight) => <SelectItem key={flight.id} value={String(flight.id)}>{flight.flightNumber}</SelectItem>)}</SelectContent>
                </Select>
                {errors.flightId && <p className="text-xs text-destructive">{errors.flightId}</p>}
              </div>
              <div className="space-y-2">
                <Label>Cabin class</Label>
                <Select value={form.cabinClassId} onValueChange={(value) => setField("cabinClassId", value)} disabled={!form.flightId}>
                  <SelectTrigger aria-invalid={Boolean(errors.cabinClassId)}><SelectValue placeholder={form.flightId ? "Select cabin" : "Select flight first"} /></SelectTrigger>
                  <SelectContent>{cabins.map((cabin) => <SelectItem key={cabin.id} value={String(cabin.id)}>{cabin.name || cabin.cabinClassType || `Cabin ${cabin.id}`}</SelectItem>)}</SelectContent>
                </Select>
                {errors.cabinClassId && <p className="text-xs text-destructive">{errors.cabinClassId}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CircleDollarSign className="size-4" /> Product and pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <div className="space-y-2"><Label htmlFor="name">Fare name</Label><Input id="name" value={form.name} onChange={(event) => setField("name", event.target.value)} aria-invalid={Boolean(errors.name)} placeholder="Economy Flex" />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
                <div className="space-y-2"><Label htmlFor="rbd">RBD code</Label><Input id="rbd" maxLength={1} value={form.rbdCode} onChange={(event) => setField("rbdCode", event.target.value.toUpperCase())} aria-invalid={Boolean(errors.rbdCode)} placeholder="Y" />{errors.rbdCode && <p className="text-xs text-destructive">{errors.rbdCode}</p>}</div>
              </div>
              <div className="space-y-2"><Label htmlFor="label">Customer-facing label</Label><Input id="label" value={form.fareLabel} onChange={(event) => setField("fareLabel", event.target.value)} placeholder="Flexible economy" maxLength={100} /></div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[["baseFare", "Base fare"], ["taxesAndFees", "Taxes and fees"], ["airlineFees", "Airline fees"]].map(([key, label]) => (
                  <div key={key} className="space-y-2"><Label htmlFor={key}>{label}</Label><Input id={key} type="number" min="0" step="0.01" value={form[key]} onChange={(event) => setField(key, event.target.value)} aria-invalid={Boolean(errors[key])} />{errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}</div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Included benefits</CardTitle></CardHeader>
            <CardContent className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              {benefitGroups.map(({ title, icon: Icon, fields }) => (
                <section key={title}>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Icon className="size-4" /> {title}</h2>
                  <div className="divide-y divide-border rounded-md border border-border">
                    {fields.map(([key, label]) => (
                      <div key={key} className="flex min-h-12 items-center justify-between gap-4 px-3 py-2">
                        <Label htmlFor={key} className="font-normal">{label}</Label>
                        <Switch id={key} checked={Boolean(form[key])} onCheckedChange={(value) => setField(key, value)} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader><CardTitle className="text-base">Price summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Base fare</span><span>{Number(form.baseFare || 0).toLocaleString("en-US")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Taxes</span><span>{Number(form.taxesAndFees || 0).toLocaleString("en-US")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Airline fees</span><span>{Number(form.airlineFees || 0).toLocaleString("en-US")}</span></div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><span>Total</span><span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)}</span></div>
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">The server calculates the final total from these components. Fare Rules and Baggage Policy are configured after saving.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </form>
  );
};

export default FareManagementForm;
