import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Info,
  Package,
  X,
  XCircle,
} from "lucide-react";
import { useSelector } from "react-redux";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const PolicyPanel = ({
  id,
  expandedSection,
  onToggle,
  icon: Icon,
  title,
  subtitle,
  children,
}) => {
  const isExpanded = expandedSection === id;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 transition-all hover:border-blue-300 dark:border-white/10 dark:hover:border-blue-400/50">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/10">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950/40"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InfoTile = ({ icon: Icon, label, value, tone = "blue" }) => {
  const toneClass =
    tone === "red"
      ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
        : tone === "amber"
          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
          : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/70">
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
      </div>
      <p className="text-sm font-semibold text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
};

const CancellationAndDateChangePolicy = () => {
  const [expandedSection, setExpandedSection] = useState("fareRules");
  const { fareRule } = useSelector((state) => state.fareRules);
  const { policy: baggagePolicy } = useSelector((state) => state.baggagePolicy);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const hasAnyPolicy = fareRule || baggagePolicy;

  if (!hasAnyPolicy) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/90"
      >
        <div className="flex items-start gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/40">
          <Info className="mt-0.5 h-5 w-5 text-slate-500 dark:text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Fare policies are not available
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              You can continue booking. Airline rules may still apply after
              ticketing.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 dark:bg-red-500/10">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-300" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            Fare Policies
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Cancellation, date change, and baggage rules for this fare.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {fareRule && (
          <PolicyPanel
            id="fareRules"
            expandedSection={expandedSection}
            onToggle={toggleSection}
            icon={AlertCircle}
            title={fareRule.ruleName || "Fare Rules"}
            subtitle={fareRule.airlineName || "Airline fare conditions"}
          >
            <div className="space-y-5">
              <div
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                  fareRule.isRefundable
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200"
                }`}
              >
                {fareRule.isRefundable ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {fareRule.isRefundable ? "Refundable fare" : "Non-refundable fare"}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <InfoTile
                  icon={XCircle}
                  label="Cancellation"
                  tone={fareRule.isRefundable ? "amber" : "red"}
                  value={
                    fareRule.isRefundable
                      ? `${currencyFormatter.format(Number(fareRule.cancellationFee || 0))} per passenger`
                      : "No refund available"
                  }
                />
                <InfoTile
                  icon={Clock}
                  label="Refund deadline"
                  value={
                    fareRule.isRefundable && fareRule.refundDeadlineDays
                      ? `${fareRule.refundDeadlineDays} days before departure`
                      : "Airline policy applies"
                  }
                />
                <InfoTile
                  icon={Calendar}
                  label="Date changes"
                  tone={fareRule.isChangeable === false ? "red" : "green"}
                  value={
                    fareRule.isChangeable === false
                      ? "Changes not allowed"
                      : "Changes allowed"
                  }
                />
                <InfoTile
                  icon={DollarSign}
                  label="Change fee"
                  tone="amber"
                  value={
                    Number(fareRule.changeFee || 0) > 0
                      ? `${currencyFormatter.format(Number(fareRule.changeFee || 0))} plus fare difference`
                      : "No change fee listed"
                  }
                />
              </div>

              <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-100">
                All fees are per passenger and subject to airline approval.
                Refund and change processing times can vary by payment method.
              </p>
            </div>
          </PolicyPanel>
        )}

        {baggagePolicy && (
          <PolicyPanel
            id="baggage"
            expandedSection={expandedSection}
            onToggle={toggleSection}
            icon={Briefcase}
            title={baggagePolicy.name || "Baggage Allowance"}
            subtitle={baggagePolicy.description || "Checked and cabin baggage"}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <InfoTile
                icon={Package}
                label="Checked baggage"
                value={[
                  baggagePolicy.checkInBaggagePieces
                    ? `${baggagePolicy.checkInBaggagePieces} piece${baggagePolicy.checkInBaggagePieces === 1 ? "" : "s"}`
                    : null,
                  baggagePolicy.checkInBaggageMaxWeight
                    ? `${baggagePolicy.checkInBaggageMaxWeight} kg total`
                    : null,
                  baggagePolicy.checkInBaggageWeightPerPiece
                    ? `${baggagePolicy.checkInBaggageWeightPerPiece} kg each`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" | ") || "Airline policy applies"}
              />
              <InfoTile
                icon={Briefcase}
                label="Cabin baggage"
                value={[
                  baggagePolicy.cabinBaggagePieces
                    ? `${baggagePolicy.cabinBaggagePieces} piece${baggagePolicy.cabinBaggagePieces === 1 ? "" : "s"}`
                    : null,
                  baggagePolicy.cabinBaggageMaxWeight
                    ? `${baggagePolicy.cabinBaggageMaxWeight} kg total`
                    : null,
                  baggagePolicy.cabinBaggageMaxDimension
                    ? `${baggagePolicy.cabinBaggageMaxDimension} cm`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" | ") || "Airline policy applies"}
              />
              <InfoTile
                icon={Check}
                label="Included checked bags"
                tone="green"
                value={
                  Number(baggagePolicy.freeCheckedBagsAllowance || 0) > 0
                    ? `${baggagePolicy.freeCheckedBagsAllowance} bag${baggagePolicy.freeCheckedBagsAllowance === 1 ? "" : "s"} included`
                    : "No free checked bag listed"
                }
              />
              <InfoTile
                icon={Info}
                label="Priority baggage"
                value={baggagePolicy.priorityBaggage ? "Included" : "Not included"}
              />
            </div>
          </PolicyPanel>
        )}
      </div>
    </motion.div>
  );
};

export default CancellationAndDateChangePolicy;
