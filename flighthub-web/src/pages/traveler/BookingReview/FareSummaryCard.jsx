import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, ChevronDown, ChevronUp, CreditCard, Tag, Info, WalletCards, Loader2, X, ShieldCheck, Zap, BadgeCheck } from 'lucide-react';

const formatCurrency = (amount = 0, currency = 'USD') => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
}).format(Number(amount) || 0);

const FareItem = ({ label, amount, highlight = false, info = null, currency = 'USD' }) => (
  <div className={`flex items-start justify-between py-2 ${highlight ? 'font-semibold' : ''}`}>
    <div className="flex items-center gap-1">
      <span className={`text-sm ${highlight ? 'text-slate-950 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
        {label}
      </span>
      {info && (
        <div className="group relative">
          <Info className="h-3 w-3 cursor-help text-slate-400" />
          <div className="absolute bottom-full left-0 z-10 mb-2 hidden w-48 rounded-lg bg-slate-950 p-2 text-xs text-white shadow-lg group-hover:block dark:bg-white dark:text-slate-950">
            {info}
          </div>
        </div>
      )}
    </div>
    <span className={`text-sm ${highlight ? 'text-slate-950 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
      {formatCurrency(amount, currency)}
    </span>
  </div>
);

const getFareAmount = (fare, field, fallbackField) => {
  const value = fare?.[field] ?? fare?.[fallbackField] ?? 0;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
};

const mealQuantity = (meal) => Math.max(Number(meal?.quantity) || 1, 1);

const getPaidAddOnAmount = (item, quantity = 1) => {
  if (!item || item.includedInFare) return 0;
  const value = item.price ?? item.totalPrice ?? item.ancillary?.price ?? 0;
  return (Number.isFinite(Number(value)) ? Number(value) : 0) * quantity;
};

const PAYMENT_OPTIONS = [
  {
    value: 'STRIPE',
    label: 'Stripe',
    description: 'Credit or debit card',
    icon: CreditCard,
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200',
  },
  {
    value: 'PAYPAL',
    label: 'PayPal',
    description: 'PayPal checkout',
    icon: WalletCards,
    badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200',
  },
];

const FareSummaryCard = ({
  fareData,
  fareItems = null,
  selectedSeats = [], // Changed from selectedSeat to selectedSeats array
  selectedMeals,
  selectedBaggage = [],
  
  travelProtection,
  paymentGateway,
  onPaymentGatewayChange,
  promoCode = "",
  appliedCoupon = null,
  promoLoading = false,
  onPromoCodeChange,
  onApplyPromo,
  onProceedToPayment,
  isLoading = false,
  totalPassengers,
  currency = 'USD',
}) => {

  const [showBreakdown, setShowBreakdown] = useState(true);

  const passengerCount = Number(totalPassengers) || 1;

  // Calculate additional charges - sum up all seats for multiple passengers
  const seatCharges = selectedSeats.reduce((sum, seat) => sum + (seat?.price || 0), 0);
  const mealCharges = (selectedMeals || []).reduce((sum, meal) => sum + (meal.price || 0) * mealQuantity(meal), 0);
  const selectedMealCount = (selectedMeals || []).reduce((sum, meal) => sum + mealQuantity(meal), 0);
  const selectedBaggageCount = selectedBaggage.reduce((sum, bag) => sum + (Number(bag.quantity) || 0), 0);
  const includedBaggageCount = selectedBaggage.reduce(
    (sum, bag) => sum + (bag.includedInFare ? Number(bag.quantity) || 0 : 0),
    0,
  );
  const baggageCharges = selectedBaggage.reduce(
    (sum, bag) => sum + getPaidAddOnAmount(bag, Number(bag.quantity) || 0),
    0,
  );

  // Get insurance price from Redux data
  const travelProtectionCharge = getPaidAddOnAmount(travelProtection, passengerCount);
  const hasIncludedTravelProtection = Boolean(travelProtection?.includedInFare);

  // Base fare calculations
  const normalizedFareItems = Array.isArray(fareItems) && fareItems.length
    ? fareItems
    : [{ label: 'Flight fare', fare: fareData }].filter((item) => item.fare);
  const baseFare = normalizedFareItems.reduce(
    (sum, item) => sum + getFareAmount(item.fare, 'baseFare', 'price') * passengerCount,
    0,
  );
  const taxes = normalizedFareItems.reduce(
    (sum, item) => sum + getFareAmount(item.fare, 'taxes', 'taxesAndFees') * passengerCount,
    0,
  );
  const subtotal = baseFare + taxes;
  const addOnsTotal = seatCharges + mealCharges + baggageCharges + travelProtectionCharge;
  const grossTotal = subtotal + addOnsTotal;
  const discountAmount = Math.min(Number(appliedCoupon?.discountAmount || 0), grossTotal);
  const grandTotal = Math.max(grossTotal - discountAmount, 0);

  // Calculate savings if any
  const savings = 0; // Can be calculated based on business logic
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/90 dark:text-white dark:shadow-black/30"
    >
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-amber-400" />
      {/* Header */}
      <div className="border-b border-slate-200 bg-gradient-to-br from-blue-50/70 via-white to-amber-50/60 p-6 dark:border-white/10 dark:from-blue-500/10 dark:via-slate-900 dark:to-amber-500/10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/10">
            <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Fare Summary</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">{passengerCount} Passenger(s)</p>
          </div>
        </div>

        {/* Quick Total */}
        <div className="rounded-lg border border-blue-100 bg-white/80 p-4 shadow-sm dark:border-blue-400/20 dark:bg-slate-950/40">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Checkout total</span>
            <div className="text-right">
              <p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                {formatCurrency(grandTotal, currency)}
              </p>
              {savings > 0 && (
                <p className="text-xs font-medium text-green-600 dark:text-green-300">You save {formatCurrency(savings, currency)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fare Breakdown */}
      <div className="p-6">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="mb-4 flex w-full items-center justify-between rounded-md text-sm font-semibold text-slate-800 transition-colors hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-300"
        >
          <span>Fare Breakdown</span>
          {showBreakdown ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-1 overflow-hidden"
            >
              {/* Base Fare & Taxes */}
              <div className="border-b border-slate-200 pb-3 dark:border-white/10">
                {normalizedFareItems.map((item, index) => {
                  const label = item.label || `Flight ${index + 1}`;
                  const itemBaseFare = getFareAmount(item.fare, 'baseFare', 'price') * passengerCount;
                  const itemTaxes = getFareAmount(item.fare, 'taxes', 'taxesAndFees') * passengerCount;

                  return (
                    <div key={`${label}-${item.fare?.id || index}`} className="py-1">
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                        {label}
                      </p>
                      <FareItem
                        label={`Base Fare x ${passengerCount}`}
                        amount={itemBaseFare}
                        currency={currency}
                        info="Basic ticket price before taxes and fees"
                      />
                      <FareItem
                        label={`Taxes & Fees x ${passengerCount}`}
                        amount={itemTaxes}
                        currency={currency}
                        info="Government taxes and airline fees"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add-ons */}
              {(seatCharges > 0 || mealCharges > 0 || baggageCharges > 0 || travelProtectionCharge > 0 || includedBaggageCount > 0 || hasIncludedTravelProtection) && (
                <div className="border-b border-slate-200 py-3 dark:border-white/10">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
                    Add-ons
                  </p>
                  {seatCharges > 0 && (
                    <FareItem label="Seat Selection" amount={seatCharges} currency={currency} />
                  )}
                  {mealCharges > 0 && (
                    <FareItem label={`Meals (${selectedMealCount})`} amount={mealCharges} currency={currency} />
                  )}
                  {baggageCharges > 0 && (
                    <FareItem
                      label={`Extra Baggage (${selectedBaggageCount} bags)`}
                      amount={baggageCharges}
                      currency={currency}
                    />
                  )}
                  {includedBaggageCount > 0 && (
                    <FareItem
                      label={`Included Baggage (${includedBaggageCount} bags)`}
                      amount={0}
                      currency={currency}
                    />
                  )}

                  {travelProtectionCharge > 0 && (
                    <FareItem label={`Travel Insurance x ${passengerCount}`} amount={travelProtectionCharge} currency={currency} />
                  )}
                  {hasIncludedTravelProtection && (
                    <FareItem label="Travel Insurance included" amount={0} currency={currency} />
                  )}
                </div>
              )}

              {discountAmount > 0 && (
                <div className="border-b border-slate-200 py-3 dark:border-white/10">
                  <FareItem
                    label={`Promo ${appliedCoupon?.code || promoCode}`}
                    amount={-discountAmount}
                    currency={currency}
                  />
                </div>
              )}

              {/* Total */}
              <div className="pt-3">
                <FareItem
                  label="Grand Total"
                  amount={grandTotal}
                  highlight={true}
                  currency={currency}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Promo Code Section */}
      <div className="px-6 pb-4">
        <div className={`rounded-lg border p-3 ${
          appliedCoupon
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-500/10'
            : 'border-amber-200 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-500/10'
        }`}>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300" />
            <input
              type="text"
              value={promoCode}
              onChange={(event) => onPromoCodeChange?.(event.target.value.toUpperCase())}
              placeholder="Enter promo code"
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-500"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={() => onPromoCodeChange?.("")}
                className="rounded-md p-1 text-emerald-700 transition-colors hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                aria-label="Remove promo code"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={promoLoading || !promoCode?.trim()}
                onClick={() => onApplyPromo?.(promoCode)}
                className="flex items-center gap-1 text-sm font-medium text-amber-700 transition-colors hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-300 dark:hover:text-amber-200"
              >
                {promoLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Apply
              </button>
            )}
          </div>
          {appliedCoupon && (
            <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-200">
              {appliedCoupon.code} applied. You saved {formatCurrency(discountAmount, currency)}.
            </p>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <div className="p-6 pt-0">
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">Payment method</p>
          <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Payment method">
            {PAYMENT_OPTIONS.map(({ value, label, description, icon: Icon, badgeClass }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={paymentGateway === value}
                onClick={() => onPaymentGatewayChange(value)}
                className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                  paymentGateway === value
                    ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200 dark:border-cyan-400/70 dark:bg-cyan-500/10 dark:ring-cyan-400/20'
                    : 'border-slate-200 bg-white hover:border-blue-300 dark:border-white/10 dark:bg-slate-950/40 dark:hover:border-blue-400/50'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${badgeClass}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-950 dark:text-white">
                      {label}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {description}
                    </span>
                  </span>
                </div>
                <span
                  className={`h-4 w-4 rounded-full border ${
                    paymentGateway === value
                      ? 'border-primary bg-primary ring-2 ring-primary/20'
                      : 'border-slate-300 dark:border-white/20'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          onClick={onProceedToPayment}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Proceed to Payment
            </>
          )}
        </motion.button>
      </div>

      {/* Trust Indicators */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-slate-50 p-2 dark:bg-white/5">
            <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-emerald-500" />
            <p className="text-xs text-slate-600 dark:text-slate-300">Secure</p>
          </div>
          <div className="rounded-md bg-slate-50 p-2 dark:bg-white/5">
            <Zap className="mx-auto mb-1 h-4 w-4 text-amber-500" />
            <p className="text-xs text-slate-600 dark:text-slate-300">Instant</p>
          </div>
          <div className="rounded-md bg-slate-50 p-2 dark:bg-white/5">
            <BadgeCheck className="mx-auto mb-1 h-4 w-4 text-blue-500 dark:text-cyan-300" />
            <p className="text-xs text-slate-600 dark:text-slate-300">Verified</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FareSummaryCard;
