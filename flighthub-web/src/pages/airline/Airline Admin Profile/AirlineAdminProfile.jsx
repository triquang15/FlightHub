import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  Building2,
  ExternalLink,
  Headphones,
  Loader2,
  MapPin,
  Pencil,
  Plane,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getAirlineByAdmin, updateAirline } from "@/Redux/airline/airlineThunks";

const EMPTY_PROFILE = {
  name: "",
  iataCode: "",
  icaoCode: "",
  alias: "",
  logoUrl: "",
  website: "",
  alliance: "",
  headquartersCityId: "",
  countryName: "",
  supportEmail: "",
  supportPhone: "",
  supportHours: "",
};

const EDITABLE_FIELDS = [
  "alias",
  "logoUrl",
  "website",
  "alliance",
  "supportEmail",
  "supportPhone",
  "supportHours",
];

const statusClass = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  SUSPENDED: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
  BANNED: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
};

const toProfile = (airline) => ({
  ...EMPTY_PROFILE,
  ...airline,
  headquartersCityId: airline?.headquartersCityId || "",
  countryName: airline?.countryName || "",
  supportEmail: airline?.support?.email || airline?.supportEmail || "",
  supportPhone: airline?.support?.phone || airline?.supportPhone || "",
  supportHours: airline?.support?.hours || airline?.supportHours || "",
});

const normalizeProfile = (profile) =>
  Object.fromEntries(
    Object.entries(profile).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ])
  );

const isValidUrl = (value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const validate = (profile) => {
  const errors = {};

  if (profile.website && !isValidUrl(profile.website)) {
    errors.website = "Enter a complete http(s) website URL.";
  }
  if (profile.logoUrl && !isValidUrl(profile.logoUrl)) {
    errors.logoUrl = "Enter a complete http(s) image URL.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.supportEmail)) {
    errors.supportEmail = "Enter a valid support email.";
  }
  if (profile.supportPhone.replace(/[^\d]/g, "").length < 7) {
    errors.supportPhone = "Enter a valid support phone number.";
  }
  if (profile.supportHours.length < 3) {
    errors.supportHours = "Enter the support team's availability.";
  }

  return errors;
};

function AirlineLogo({ profile }) {
  const fallback = profile.iataCode || profile.name?.slice(0, 2).toUpperCase() || "AL";

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-primary text-lg font-semibold text-primary-foreground">
      {fallback}
      {profile.logoUrl ? (
        <img
          src={profile.logoUrl}
          alt={`${profile.name || "Airline"} logo`}
          className="absolute inset-0 h-full w-full bg-white object-contain p-2"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </div>
  );
}

function IdentityItem({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-medium">{value || "Not configured"}</p>
    </div>
  );
}

function FormField({ id, label, value, onChange, disabled, error, placeholder, type = "text", description }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export default function AirlineAdminProfile() {
  const dispatch = useDispatch();
  const { currentAirline, loading, error, updateLoading } = useSelector((state) => state.airline);
  const profile = useMemo(() => toProfile(currentAirline), [currentAirline]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(EMPTY_PROFILE);
  const [formErrors, setFormErrors] = useState({});

  const displayed = editing ? draft : profile;
  const dirty = editing && EDITABLE_FIELDS.some((field) => draft[field] !== profile[field]);
  const status = String(currentAirline?.status || "INACTIVE").toUpperCase();

  useEffect(() => {
    dispatch(getAirlineByAdmin());
  }, [dispatch]);

  const startEditing = () => {
    setDraft(profile);
    setFormErrors({});
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setFormErrors({});
    setEditing(false);
  };

  const changeField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const saveProfile = async () => {
    const normalized = normalizeProfile(draft);
    const validationErrors = validate(normalized);

    if (Object.keys(validationErrors).length) {
      setFormErrors(validationErrors);
      return;
    }

    try {
      await dispatch(
        updateAirline({
          id: currentAirline.id,
          iataCode: profile.iataCode,
          icaoCode: profile.icaoCode,
          name: profile.name,
          headquartersCityId: profile.headquartersCityId
            ? Number(profile.headquartersCityId)
            : null,
          alias: normalized.alias,
          logoUrl: normalized.logoUrl,
          website: normalized.website,
          alliance: normalized.alliance,
          supportEmail: normalized.supportEmail,
          supportPhone: normalized.supportPhone,
          supportHours: normalized.supportHours,
        })
      ).unwrap();
      setEditing(false);
      setFormErrors({});
      toast.success("Airline profile updated");
    } catch (saveError) {
      setFormErrors({
        submit: typeof saveError === "string" ? saveError : "Unable to update airline profile.",
      });
    }
  };

  if (loading && !currentAirline) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading airline profile...
        </div>
      </div>
    );
  }

  if (error && !currentAirline) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertCircle />
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error || "Unable to load airline profile."}</span>
          <Button variant="outline" size="sm" onClick={() => dispatch(getAirlineByAdmin())}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      {formErrors.submit ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{formErrors.submit}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <AirlineLogo profile={displayed} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold">{profile.name || "Airline organization"}</h2>
                  <Badge variant="outline" className={statusClass[status] || statusClass.INACTIVE}>
                    {status}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {profile.alias || "Public brand name not configured"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {profile.website ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={profile.website} target="_blank" rel="noreferrer">
                    <ExternalLink />
                    Website
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <IdentityItem icon={Plane} label="Airline codes" value={`${profile.iataCode || "--"} / ${profile.icaoCode || "---"}`} />
            <IdentityItem icon={MapPin} label="Country" value={profile.countryName} />
            <IdentityItem icon={Building2} label="Headquarters ID" value={profile.headquartersCityId} />
            <IdentityItem icon={ShieldCheck} label="Organization ID" value={currentAirline?.id} />
          </div>

          <p className="text-xs text-muted-foreground">
            Airline identity, codes, country, headquarters, and status are verified by FlightHub platform operations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <CardTitle>Public information</CardTitle>
            <CardDescription>Brand and support information visible to travelers.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={cancelEditing} disabled={updateLoading}>
                  <X />
                  Cancel
                </Button>
                <Button size="sm" onClick={saveProfile} disabled={updateLoading || !dirty}>
                  {updateLoading ? <Loader2 className="animate-spin" /> : <Save />}
                  {updateLoading ? "Saving" : "Save changes"}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil />
                Edit profile
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-7">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Brand</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Public-facing brand details used throughout search and booking.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="alias"
                label="Public brand name"
                value={displayed.alias}
                onChange={changeField}
                disabled={!editing}
                placeholder={profile.name || "Airline brand name"}
              />
              <FormField
                id="alliance"
                label="Airline alliance"
                value={displayed.alliance}
                onChange={changeField}
                disabled={!editing}
                placeholder="e.g. SkyTeam"
              />
              <FormField
                id="website"
                label="Public website"
                type="url"
                value={displayed.website}
                onChange={changeField}
                disabled={!editing}
                placeholder="https://airline.example"
                error={formErrors.website}
              />
              <FormField
                id="logoUrl"
                label="Logo URL"
                type="url"
                value={displayed.logoUrl}
                onChange={changeField}
                disabled={!editing}
                placeholder="https://cdn.example/logo.png"
                error={formErrors.logoUrl}
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-start gap-2">
              <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-semibold">Customer support</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Keep these contacts monitored for booking and disruption assistance.
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="supportEmail"
                label="Support email"
                type="email"
                value={displayed.supportEmail}
                onChange={changeField}
                disabled={!editing}
                placeholder="support@airline.example"
                error={formErrors.supportEmail}
              />
              <FormField
                id="supportPhone"
                label="Support phone"
                type="tel"
                value={displayed.supportPhone}
                onChange={changeField}
                disabled={!editing}
                placeholder="+84 28 1234 5678"
                error={formErrors.supportPhone}
              />
              <FormField
                id="supportHours"
                label="Support availability"
                value={displayed.supportHours}
                onChange={changeField}
                disabled={!editing}
                placeholder="24/7 or Mon-Fri, 08:00-18:00 ICT"
                description="Include a timezone when support is not available 24/7."
                error={formErrors.supportHours}
              />
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
