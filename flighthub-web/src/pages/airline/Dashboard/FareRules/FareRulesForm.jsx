import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRightLeft, CircleDollarSign, Loader2, Save, ShieldCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getCabinClassesByAircraft } from "@/Redux/cabinClass/cabinClassThunk";
import { getFlightFares } from "@/Redux/fare/fareThunk";
import { clearCurrentFareRule, clearFareRulesError } from "@/Redux/fareRules/fareRulesSlice";
import { createFareRule, getFareRuleById, updateFareRule } from "@/Redux/fareRules/fareRulesThunk";
import { getFlightsByAirline } from "@/Redux/flight/flightThunk";

const EMPTY_FORM = {
  ruleName: "",
  fareId: "",
  isRefundable: false,
  cancellationFee: "",
  refundDeadlineDays: "",
  isChangeable: false,
  changeFee: "",
  changeDeadlineHours: "",
};

const toOptionalNumber = (value) => (value === "" ? null : Number(value));

const FieldError = ({ children }) => children ? <p className="text-xs text-destructive">{children}</p> : null;

const FareRulesForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);

  const { flights = [] } = useSelector((state) => state.flight);
  const { cabinClasses = [] } = useSelector((state) => state.cabinClass);
  const { fares = [], loading: faresLoading } = useSelector((state) => state.fare);
  const { currentFareRule, loading, error } = useSelector((state) => state.fareRules);

  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFlight, setSelectedFlight] = useState("");
  const [selectedCabin, setSelectedCabin] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(clearFareRulesError());
    dispatch(getFlightsByAirline());
    if (editing) dispatch(getFareRuleById(id));
    else dispatch(clearCurrentFareRule());

    return () => {
      dispatch(clearCurrentFareRule());
      dispatch(clearFareRulesError());
    };
  }, [dispatch, editing, id]);

  useEffect(() => {
    if (!editing || !currentFareRule || String(currentFareRule.id) !== String(id)) return;
    // Hydrate the route-specific editable draft after the API response arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      ruleName: currentFareRule.ruleName ?? "",
      fareId: String(currentFareRule.fareId ?? ""),
      isRefundable: Boolean(currentFareRule.isRefundable),
      cancellationFee: currentFareRule.cancellationFee ?? "",
      refundDeadlineDays: currentFareRule.refundDeadlineDays ?? "",
      isChangeable: Boolean(currentFareRule.isChangeable),
      changeFee: currentFareRule.changeFee ?? "",
      changeDeadlineHours: currentFareRule.changeDeadlineHours ?? "",
    });
  }, [currentFareRule, editing, id]);

  const availableFares = useMemo(
    () => (Array.isArray(fares) ? fares : []).filter((fare) => !fare.fareRulesId && !fare.fareRules),
    [fares],
  );

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleFlightChange = (flightId) => {
    setSelectedFlight(flightId);
    setSelectedCabin("");
    updateField("fareId", "");
    const flight = flights.find((item) => String(item.id) === flightId);
    const aircraftId = flight?.aircraft?.id ?? flight?.aircraftId;
    if (aircraftId) dispatch(getCabinClassesByAircraft(aircraftId));
  };

  const handleCabinChange = (cabinId) => {
    setSelectedCabin(cabinId);
    updateField("fareId", "");
    if (selectedFlight && cabinId) {
      dispatch(getFlightFares({ flightId: Number(selectedFlight), cabinId: Number(cabinId) }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.ruleName.trim()) nextErrors.ruleName = "Rule name is required.";
    if (!editing && !selectedFlight) nextErrors.flight = "Select a flight.";
    if (!editing && !selectedCabin) nextErrors.cabin = "Select a cabin class.";
    if (!form.fareId) nextErrors.fareId = "Select a fare.";
    if (form.isRefundable) {
      if (toOptionalNumber(form.cancellationFee) < 0) nextErrors.cancellationFee = "Fee cannot be negative.";
      if (!Number.isInteger(toOptionalNumber(form.refundDeadlineDays)) || toOptionalNumber(form.refundDeadlineDays) < 0) {
        nextErrors.refundDeadlineDays = "Enter a whole number of days.";
      }
    }
    if (form.isChangeable) {
      if (toOptionalNumber(form.changeFee) < 0) nextErrors.changeFee = "Fee cannot be negative.";
      if (!Number.isInteger(toOptionalNumber(form.changeDeadlineHours)) || toOptionalNumber(form.changeDeadlineHours) < 0) {
        nextErrors.changeDeadlineHours = "Enter a whole number of hours.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      ruleName: form.ruleName.trim(),
      fareId: Number(form.fareId),
      isRefundable: form.isRefundable,
      cancellationFee: form.isRefundable ? toOptionalNumber(form.cancellationFee) : null,
      refundDeadlineDays: form.isRefundable ? toOptionalNumber(form.refundDeadlineDays) : null,
      isChangeable: form.isChangeable,
      changeFee: form.isChangeable ? toOptionalNumber(form.changeFee) : null,
      changeDeadlineHours: form.isChangeable ? toOptionalNumber(form.changeDeadlineHours) : null,
    };

    try {
      const saved = editing
        ? await dispatch(updateFareRule({ id, fareRuleData: payload })).unwrap()
        : await dispatch(createFareRule(payload)).unwrap();
      toast.success(editing ? "Fare rule updated" : "Fare rule created", {
        description: `${saved.ruleName} is ready for fare #${saved.fareId}.`,
      });
      navigate(`/airline/fare-rules/${saved.id}`);
    } catch (submitError) {
      toast.error(editing ? "Unable to update fare rule" : "Unable to create fare rule", {
        description: String(submitError),
      });
    }
  };

  const disableSave = loading || (editing && !currentFareRule);

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <Button type="button" variant="ghost" size="icon" aria-label="Back to fare rules" onClick={() => navigate("/airline/fare-rules")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <p className="text-sm font-medium text-primary">Commercial controls</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">{editing ? "Edit fare rule" : "Create fare rule"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Configure customer flexibility for one published fare.</p>
          </div>
        </div>
        <Button type="submit" disabled={disableSave}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {editing ? "Save changes" : "Create rule"}
        </Button>
      </header>

      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {!editing && (
        <section className="rounded-md border border-border bg-card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-foreground">Fare assignment</h2>
            <p className="mt-1 text-xs text-muted-foreground">Only fares without an existing rule are available.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Flight</Label>
              <Select value={selectedFlight} onValueChange={handleFlightChange}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select flight" /></SelectTrigger>
                <SelectContent>
                  {flights.map((flight) => (
                    <SelectItem key={flight.id} value={String(flight.id)}>
                      {flight.flightNumber} · {flight.departureAirport?.iataCode}–{flight.arrivalAirport?.iataCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.flight}</FieldError>
            </div>
            <div className="space-y-2">
              <Label>Cabin class</Label>
              <Select value={selectedCabin} onValueChange={handleCabinChange} disabled={!selectedFlight}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select cabin" /></SelectTrigger>
                <SelectContent>
                  {cabinClasses.map((cabin) => <SelectItem key={cabin.id} value={String(cabin.id)}>{cabin.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldError>{errors.cabin}</FieldError>
            </div>
            <div className="space-y-2">
              <Label>Fare</Label>
              <Select value={form.fareId} onValueChange={(value) => updateField("fareId", value)} disabled={!selectedCabin || faresLoading}>
                <SelectTrigger className="w-full"><SelectValue placeholder={faresLoading ? "Loading fares..." : "Select fare"} /></SelectTrigger>
                <SelectContent>
                  {availableFares.map((fare) => (
                    <SelectItem key={fare.id} value={String(fare.id)}>
                      {fare.name} · {fare.rbdCode} · {Number(fare.currentPrice ?? fare.baseFare).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.fareId}</FieldError>
              {selectedCabin && !faresLoading && availableFares.length === 0 && (
                <p className="text-xs text-muted-foreground">No unconfigured fares are available in this cabin.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-md border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-2">
            <Label htmlFor="ruleName">Rule name</Label>
            <Input id="ruleName" value={form.ruleName} onChange={(event) => updateField("ruleName", event.target.value)} placeholder="Example: Economy Flex" maxLength={100} />
            <FieldError>{errors.ruleName}</FieldError>
          </div>
          <div className="space-y-2">
            <Label>Assigned fare</Label>
            <div className="flex h-8 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm text-foreground">
              {form.fareId ? `Fare #${form.fareId}` : "Not selected"}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-4 sm:p-5">
          <div className="flex min-h-14 items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="size-4" /> Refund policy</h2>
              <p className="mt-1 text-xs text-muted-foreground">Allow cancellation and refund before departure.</p>
            </div>
            <Switch checked={form.isRefundable} onCheckedChange={(checked) => updateField("isRefundable", checked)} aria-label="Refundable fare" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cancellationFee">Cancellation fee</Label>
              <Input id="cancellationFee" type="number" min="0" step="0.01" disabled={!form.isRefundable} value={form.cancellationFee} onChange={(event) => updateField("cancellationFee", event.target.value)} placeholder="0.00" />
              <FieldError>{errors.cancellationFee}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refundDeadlineDays">Deadline in days</Label>
              <Input id="refundDeadlineDays" type="number" min="0" step="1" disabled={!form.isRefundable} value={form.refundDeadlineDays} onChange={(event) => updateField("refundDeadlineDays", event.target.value)} placeholder="7" />
              <FieldError>{errors.refundDeadlineDays}</FieldError>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-4 sm:p-5">
          <div className="flex min-h-14 items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-foreground"><ArrowRightLeft className="size-4" /> Change policy</h2>
              <p className="mt-1 text-xs text-muted-foreground">Allow travel changes before the scheduled departure.</p>
            </div>
            <Switch checked={form.isChangeable} onCheckedChange={(checked) => updateField("isChangeable", checked)} aria-label="Changeable fare" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="changeFee">Change fee</Label>
              <Input id="changeFee" type="number" min="0" step="0.01" disabled={!form.isChangeable} value={form.changeFee} onChange={(event) => updateField("changeFee", event.target.value)} placeholder="0.00" />
              <FieldError>{errors.changeFee}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="changeDeadlineHours">Deadline in hours</Label>
              <Input id="changeDeadlineHours" type="number" min="0" step="1" disabled={!form.isChangeable} value={form.changeDeadlineHours} onChange={(event) => updateField("changeDeadlineHours", event.target.value)} placeholder="24" />
              <FieldError>{errors.changeDeadlineHours}</FieldError>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4 text-sm">
        <CircleDollarSign className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">A zero fee means the permitted action is free. Deadlines are measured backward from scheduled departure.</p>
      </section>
    </form>
  );
};

export default FareRulesForm;
