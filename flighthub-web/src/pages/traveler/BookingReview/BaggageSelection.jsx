import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Briefcase,
  Info,
  Minus,
  Package,
  Plus,
  Ruler,
  Weight,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";

const formatCurrency = (amount = 0, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const getBaggageMetadata = (option) =>
  option?.ancillary?.metadata?.baggage ||
  option?.metadata?.baggage ||
  option?.baggage ||
  {};

const getBaggagePrice = (option) => {
  const value =
    option?.price ??
    option?.totalPrice ??
    option?.ancillary?.price ??
    option?.ancillary?.basePrice ??
    0;

  return Number.isFinite(Number(value)) ? Number(value) : 0;
};

const getCategoryConfig = (category = "CHECKED") => {
  const normalized = String(category).toUpperCase();

  if (normalized === "CARRY_ON" || normalized === "CABIN") {
    return {
      icon: Package,
      label: "Cabin baggage",
      shell: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200",
      iconShell: "bg-cyan-50 dark:bg-cyan-500/10",
      iconColor: "text-cyan-600 dark:text-cyan-300",
    };
  }

  return {
    icon: Briefcase,
    label: "Checked baggage",
    shell: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200",
    iconShell: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-300",
  };
};

const DetailPill = ({ icon: Icon, label, value }) => (
  <div className="flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
    <Icon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
    <div className="min-w-0">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/90"
  >
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/10">
        <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-300" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
          Extra Baggage
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Add checked or cabin baggage when available for this fare.
        </p>
      </div>
    </div>
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-white/10 dark:bg-slate-950/40">
      <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-400 dark:text-slate-500" />
      <p className="text-sm font-semibold text-slate-950 dark:text-white">
        No extra baggage options available
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Included baggage is still governed by the fare policy.
      </p>
    </div>
  </motion.div>
);

const BaggageSelection = ({ selectedBaggage = [], onSelectBaggage }) => {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const { ancillariesByType, loadingByType } = useSelector(
    (state) => state.flightCabinAncillary,
  );

  const loading = Boolean(loadingByType?.BAGGAGE);
  const selectedItems = Array.isArray(selectedBaggage) ? selectedBaggage : [];

  const baggageData = useMemo(() => {
    return normalizeList(ancillariesByType?.BAGGAGE)
      .map((option) => {
        const metadata = getBaggageMetadata(option);
        const id = option?.id ?? option?.flightCabinAncillaryId ?? option?.ancillary?.id;
        const rawCategory = metadata?.category || option?.ancillary?.subType || "CHECKED";
        const maxQuantity = Number(metadata?.maxQuantity ?? option?.maxQuantity ?? 5);

        return {
          id,
          ancillaryId: option?.ancillary?.id,
          name: option?.ancillary?.name || option?.name || "Extra Baggage",
          description:
            option?.ancillary?.description ||
            option?.description ||
            "Additional baggage allowance for this flight.",
          price: getBaggagePrice(option),
          currency: String(option?.currency || option?.ancillary?.currency || "USD").toUpperCase(),
          iconUrl: option?.ancillary?.iconUrl || option?.iconUrl,
          available: option?.available !== false && option?.status !== "INACTIVE",
          includedInFare: Boolean(option?.includedInFare),
          flightId: option?.flightId,
          type: option?.ancillary?.type || option?.type,
          subType: option?.ancillary?.subType || option?.subType,
          rfisc: option?.ancillary?.rfisc || option?.rfisc,
          category: rawCategory,
          weight: Number(metadata?.weight || option?.weight || 0),
          unit: metadata?.unit || option?.unit || "KG",
          pieces: Number(metadata?.pieces || option?.pieces || 1),
          dimensions: metadata?.dimensions || option?.dimensions || "",
          notes: metadata?.notes || option?.notes || "",
          displayOrder: option?.ancillary?.displayOrder || option?.displayOrder || 0,
          maxQuantity: Number.isFinite(maxQuantity) && maxQuantity > 0 ? maxQuantity : 5,
        };
      })
      .filter((item) => item.id !== null && item.id !== undefined)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [ancillariesByType?.BAGGAGE]);

  const categories = useMemo(() => {
    const availableCategories = new Set(
      baggageData.map((item) => String(item.category || "CHECKED").toUpperCase()),
    );

    return [
      { value: "ALL", label: "All" },
      ...(availableCategories.has("CHECKED")
        ? [{ value: "CHECKED", label: "Checked" }]
        : []),
      ...(availableCategories.has("CABIN") || availableCategories.has("CARRY_ON")
        ? [{ value: "CABIN", label: "Cabin" }]
        : []),
    ];
  }, [baggageData]);

  const displayedBaggage = useMemo(() => {
    if (activeCategory === "ALL") return baggageData;

    return baggageData.filter((item) => {
      const category = String(item.category || "CHECKED").toUpperCase();
      if (activeCategory === "CABIN") {
        return category === "CABIN" || category === "CARRY_ON";
      }
      return category === activeCategory;
    });
  }, [activeCategory, baggageData]);

  const getBaggageQuantity = (baggageId) => {
    const item = selectedItems.find((b) => b.id === baggageId);
    return Number(item?.quantity || 0);
  };

  const handleQuantityChange = (baggage, change) => {
    if (!baggage.available) return;

    const currentQuantity = getBaggageQuantity(baggage.id);
    const nextQuantity = Math.max(
      0,
      Math.min(baggage.maxQuantity, currentQuantity + change),
    );

    if (nextQuantity === 0) {
      onSelectBaggage(selectedItems.filter((item) => item.id !== baggage.id));
      return;
    }

    const existingIndex = selectedItems.findIndex((item) => item.id === baggage.id);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex] = { ...baggage, quantity: nextQuantity };
      onSelectBaggage(updated);
      return;
    }

    onSelectBaggage([...selectedItems, { ...baggage, quantity: nextQuantity }]);
  };

  const totalBaggageCount = selectedItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const totalBaggageCost = selectedItems.reduce(
    (sum, item) => sum + (item.includedInFare ? 0 : Number(item.price || 0) * Number(item.quantity || 0)),
    0,
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-300"></div>
        </div>
      </div>
    );
  }

  if (!baggageData.length) {
    return <EmptyState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90"
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/10">
            <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Extra Baggage
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Optional allowance. Included baggage stays under your fare policy.
            </p>
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left sm:text-right dark:border-white/10 dark:bg-slate-950/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">Selected</p>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            {totalBaggageCount} bags | {formatCurrency(totalBaggageCost)}
          </p>
        </div>
      </div>

      {categories.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setActiveCategory(category.value)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeCategory === category.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {displayedBaggage.map((baggage) => {
          const quantity = getBaggageQuantity(baggage.id);
          const categoryConfig = getCategoryConfig(baggage.category);
          const CategoryIcon = categoryConfig.icon;
          const optionTotal = baggage.price * quantity;

          return (
            <motion.div
              key={baggage.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`overflow-hidden rounded-lg border transition-all ${
                quantity > 0
                  ? "border-blue-500 bg-blue-50/70 shadow-sm dark:border-blue-400/70 dark:bg-blue-500/10"
                  : baggage.available
                    ? "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/30 dark:hover:border-blue-400/50"
                    : "border-slate-200 bg-slate-50 opacity-70 dark:border-white/10 dark:bg-slate-950/30"
              }`}
            >
              <div className="p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-start gap-3">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 dark:border-white/10 ${categoryConfig.iconShell}`}
                      >
                        {baggage.iconUrl ? (
                          <img
                            src={baggage.iconUrl}
                            alt={baggage.name}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <CategoryIcon className={`h-5 w-5 ${categoryConfig.iconColor}`} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-2">
                          <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                            {baggage.name}
                          </h3>
                          {baggage.includedInFare && (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                              Included
                            </span>
                          )}
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${categoryConfig.shell}`}
                          >
                            {categoryConfig.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                          {baggage.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {baggage.weight > 0 && (
                        <DetailPill
                          icon={Weight}
                          label="Weight"
                          value={`${baggage.weight} ${baggage.unit}`}
                        />
                      )}
                      {baggage.pieces > 0 && (
                        <DetailPill
                          icon={Package}
                          label="Pieces"
                          value={`${baggage.pieces} piece${baggage.pieces > 1 ? "s" : ""}`}
                        />
                      )}
                      {baggage.dimensions && (
                        <DetailPill
                          icon={Ruler}
                          label="Max size"
                          value={baggage.dimensions}
                        />
                      )}
                    </div>

                    {(baggage.notes || baggage.rfisc) && (
                      <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/20 dark:bg-amber-400/10">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                        <p className="text-xs leading-5 text-amber-800 dark:text-amber-100">
                          {baggage.notes || `Service code ${baggage.rfisc}`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t border-slate-200 pt-4 xl:min-w-56 xl:flex-col xl:items-end xl:border-t-0 xl:pt-0 dark:border-white/10">
                    <div className="text-left xl:text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Price per bag
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                        {baggage.includedInFare ? "Included" : formatCurrency(baggage.price, baggage.currency)}
                      </p>
                      {quantity > 0 && (
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Total {baggage.includedInFare ? "Included" : formatCurrency(optionTotal, baggage.currency)}
                        </p>
                      )}
                    </div>

                    {baggage.available ? (
                      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-slate-950">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(baggage, -1)}
                          disabled={quantity === 0}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          aria-label={`Remove ${baggage.name}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-slate-950 dark:text-white">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(baggage, 1)}
                          disabled={quantity >= baggage.maxQuantity}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Add ${baggage.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-200">
                        <AlertCircle className="h-4 w-4" />
                        Not available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedItems.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Selected baggage ({totalBaggageCount} bags)
            </p>
            <div className="flex items-center gap-3">
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(totalBaggageCost)}
              </p>
              <button
                type="button"
                onClick={() => onSelectBaggage([])}
                className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:text-emerald-100 dark:hover:bg-emerald-400/10"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border border-white/70 bg-white p-3 text-sm shadow-sm dark:border-white/10 dark:bg-slate-950/50"
              >
                <div className="min-w-0 flex flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-blue-50 dark:border-white/10 dark:bg-blue-500/10">
                    {item.iconUrl ? (
                      <img
                        src={item.iconUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.weight ? `${item.weight} ${item.unit} | ` : ""}
                      {item.quantity} bag{item.quantity > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {item.includedInFare ? "Included" : formatCurrency(item.price * item.quantity, item.currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectBaggage(selectedItems.filter((b) => b.id !== item.id))
                    }
                    className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default BaggageSelection;
