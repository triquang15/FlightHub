import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
  Info,
  Package,
  Plane,
  ShieldCheck,
} from "lucide-react";
import { useSelector } from "react-redux";

const formatCurrency = (amount = 0, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const normalizePackages = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return payload ? [payload] : [];
};

const getCoverageIcon = (coverageType) => {
  const iconMap = {
    BAGGAGE_ASSISTANCE: Package,
    BAGGAGE_LOSS: Package,
    BAGGAGE_DELAY: Clock,
    PERSONAL_ACCIDENT: Heart,
    MISSED_CONNECTION: Plane,
    TRIP_CANCELLATION: Ban,
    DIVERTED_FLIGHT: AlertTriangle,
    TRIP_DELAY: Clock,
  };
  return iconMap[coverageType] || ShieldCheck;
};

const formatCoverageType = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getPackagePrice = (option) => {
  const value = option?.price ?? option?.totalPrice ?? option?.ancillary?.price ?? 0;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
};

const normalizeProtectionOption = (option) => ({
  ...option,
  price: getPackagePrice(option),
  currency: String(option?.currency || option?.ancillary?.currency || "USD").toUpperCase(),
  includedInFare: Boolean(option?.includedInFare),
  available: option?.available !== false && option?.status !== "INACTIVE",
});

const TripSecure = ({ selectedTravelProtection, onSelectTravelProtection }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { ancillariesByType } = useSelector(
    (state) => state.flightCabinAncillary,
  );

  const protectionOptions = useMemo(
    () => normalizePackages(ancillariesByType.TRAVEL_PROTECTION).map(normalizeProtectionOption),
    [ancillariesByType.TRAVEL_PROTECTION],
  );
  const availableOptions = protectionOptions.filter((option) => option.available);
  const selectedOptionId = selectedTravelProtection?.id || selectedTravelProtection?.ancillaryId;
  const tripSecureData =
    availableOptions.find((option) => (option.id || option.ancillaryId) === selectedOptionId) ||
    selectedTravelProtection ||
    availableOptions[0] ||
    null;

  const coverages = Array.isArray(tripSecureData?.ancillary?.coverages)
    ? tripSecureData.ancillary.coverages
    : [];
  const sortedCoverages = [...coverages].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
  );
  const previewCoverages = sortedCoverages.slice(0, 3);
  const totalCoverage = coverages.reduce(
    (sum, coverage) => sum + Number(coverage.coverageAmount || 0),
    0,
  );
  const insurancePrice = Number(tripSecureData?.price || 0);
  const insuranceCurrency = tripSecureData?.currency || "USD";
  const insuranceName = tripSecureData?.ancillary?.name || "Travel Protection";
  const insuranceDescription =
    tripSecureData?.ancillary?.description ||
    "Optional coverage for baggage, delays, missed connections, and other disruptions.";
  const emergencyContact =
    coverages.find((coverage) => coverage.emergencyContact)?.emergencyContact ||
    "1800-123-4567";
  const isSelected = Boolean(selectedTravelProtection);

  const handleSelection = (value) => {
    onSelectTravelProtection(value === "yes" && tripSecureData ? tripSecureData : null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90"
    >
      <div className="border-b border-slate-200 p-6 dark:border-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/10">
              <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                {insuranceName}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {insuranceDescription}
              </p>
            </div>
          </div>
          {tripSecureData && (
            <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-left sm:text-right dark:border-blue-400/20 dark:bg-blue-500/10">
              <p className="text-xs text-slate-600 dark:text-slate-300">Per passenger</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-200">
                {tripSecureData.includedInFare ? "Included" : formatCurrency(insurancePrice, insuranceCurrency)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {!availableOptions.length ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-white/10 dark:bg-slate-950/40">
            <ShieldCheck className="mx-auto mb-2 h-9 w-9 text-slate-400 dark:text-slate-500" />
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Travel protection is unavailable
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This fare can still be booked without insurance.
            </p>
          </div>
        ) : (
          <>
            {availableOptions.length > 1 && (
              <div className="mb-5 grid gap-3 md:grid-cols-2">
                {availableOptions.map((option) => {
                  const optionId = option.id || option.ancillaryId;
                  const optionSelected = selectedOptionId === optionId;

                  return (
                    <button
                      key={optionId}
                      type="button"
                      onClick={() => onSelectTravelProtection(option)}
                      className={`rounded-lg border p-4 text-left transition-all ${
                        optionSelected
                          ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-300 dark:bg-blue-500/10"
                          : "border-slate-200 bg-white hover:border-blue-300 dark:border-white/10 dark:bg-slate-950/40 dark:hover:border-blue-400/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950 dark:text-white">
                            {option.ancillary?.name || "Travel Protection"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {option.ancillary?.description || "Trip disruption coverage"}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-blue-700 dark:text-blue-200">
                          {option.includedInFare ? "Included" : formatCurrency(option.price, option.currency)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {isSelected ? "Protection added" : "Protection not selected"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                    {isSelected
                      ? tripSecureData.includedInFare
                        ? "Included in your fare for every passenger."
                        : `Added for ${formatCurrency(insurancePrice, insuranceCurrency)} per passenger.`
                      : "You can continue without insurance; claims support will not be included."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-md bg-white p-1 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => handleSelection("yes")}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelection("no")}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                      !isSelected
                        ? "bg-slate-800 text-white shadow-sm dark:bg-slate-200 dark:text-slate-950"
                        : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>

            {coverages.length > 0 && (
              <div className="mt-5">
                <div className="mb-3 grid gap-2 md:grid-cols-3">
                  {previewCoverages.map((coverage) => {
                    const Icon = getCoverageIcon(coverage.coverageType);

                    return (
                      <div
                        key={coverage.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/30"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                          <p className="truncate text-xs font-semibold text-slate-950 dark:text-white">
                            {coverage.name}
                          </p>
                        </div>
                        {coverage.coverageAmount > 0 && (
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(coverage.coverageAmount, insuranceCurrency)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowDetails((value) => !value)}
                  className="flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    <span className="text-sm font-semibold text-slate-950 dark:text-white">
                      {showDetails ? "Hide coverage details" : `View all ${coverages.length} coverage details`}
                    </span>
                  </div>
                  {showDetails ? (
                    <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  )}
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 space-y-3 overflow-hidden"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        {sortedCoverages.map((coverage) => {
                          const Icon = getCoverageIcon(coverage.coverageType);

                          return (
                            <div
                              key={coverage.id}
                              className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40"
                            >
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/10">
                                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-950 dark:text-white">
                                      {coverage.name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {formatCoverageType(coverage.coverageType)}
                                    </p>
                                  </div>
                                </div>
                                {coverage.coverageAmount > 0 && (
                                  <span className="shrink-0 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                    {formatCurrency(coverage.coverageAmount, insuranceCurrency)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                                {coverage.description}
                              </p>
                              {coverage.claimCondition && (
                                <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs leading-5 text-amber-800 dark:bg-amber-400/10 dark:text-amber-100">
                                  {coverage.claimCondition}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-400/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">
                              Total coverage value
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              Emergency assistance: {emergencyContact}
                            </p>
                          </div>
                          <p className="shrink-0 text-lg font-bold text-blue-700 dark:text-blue-200">
                            {formatCurrency(totalCoverage, insuranceCurrency)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default TripSecure;
