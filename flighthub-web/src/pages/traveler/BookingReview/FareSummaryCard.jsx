import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, ChevronDown, ChevronUp, CreditCard, Tag, Info, WalletCards } from 'lucide-react';

const formatCurrency = (amount = 0) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(Number(amount) || 0);

const FareItem = ({ label, amount, highlight = false, info = null }) => (
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
      {formatCurrency(amount)}
    </span>
  </div>
);

const PAYMENT_OPTIONS = [
  {
    value: 'STRIPE',
    label: 'Stripe',
    description: 'Credit or debit card',
    icon: CreditCard,
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200',
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
  selectedSeats = [], // Changed from selectedSeat to selectedSeats array
  selectedMeals,
  selectedBaggage = [],
  
  travelProtection,
  paymentGateway,
  onPaymentGatewayChange,
  onProceedToPayment,
  isLoading = false,
  totalPassengers
}) => {

  const [showBreakdown, setShowBreakdown] = useState(true);

  const passengerCount = Number(totalPassengers) || 1;

  // Calculate additional charges - sum up all seats for multiple passengers
  const seatCharges = selectedSeats.reduce((sum, seat) => sum + (seat?.price || 0), 0);
  const mealCharges = (selectedMeals || []).reduce((sum, meal) => sum + (meal.price || 0), 0);
  const baggageCharges = selectedBaggage.reduce((sum, bag) => sum + ((bag.price || 0) * (bag.quantity || 0)), 0);

  // Get insurance price from Redux data
  const travelProtectionCharge = (travelProtection?.price || 0) * passengerCount;

  // Base fare calculations
  const baseFarePerPassenger = Number(fareData?.baseFare ?? fareData?.price ?? 0) || 0;
  const taxesPerPassenger = Number(fareData?.taxes ?? fareData?.taxesAndFees ?? 0) || 0;
  const baseFare = baseFarePerPassenger * passengerCount;
  const taxes = taxesPerPassenger * passengerCount;
  const subtotal = baseFare + taxes;
  const addOnsTotal = seatCharges + mealCharges + baggageCharges + travelProtectionCharge;
  const grandTotal = subtotal + addOnsTotal;

  // Calculate savings if any
  const savings = 0; // Can be calculated based on business logic
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-24 rounded-lg border border-slate-200 bg-white text-slate-950 shadow-lg dark:border-white/10 dark:bg-slate-900/90 dark:text-white dark:shadow-black/30"
    >
      {/* Header */}
      <div className="border-b border-slate-200 p-6 dark:border-white/10">
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
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-300">Total Amount</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-950 dark:text-white">
                {formatCurrency(grandTotal)}
              </p>
              {savings > 0 && (
                <p className="text-xs font-medium text-green-600 dark:text-green-300">You save {formatCurrency(savings)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fare Breakdown */}
      <div className="p-6">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="mb-4 flex w-full items-center justify-between text-sm font-semibold text-slate-800 transition-colors hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-300"
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
                <FareItem
                  label={`Base Fare x ${passengerCount}`}
                  amount={baseFare}
                  info="Basic ticket price before taxes and fees"
                />
                <FareItem
                  label={`Taxes & Fees x ${passengerCount}`}
                  amount={taxes}
                  info="Government taxes and airline fees"
                />
              </div>

              {/* Add-ons */}
              {(seatCharges > 0 || mealCharges > 0 || baggageCharges > 0 || travelProtectionCharge > 0) && (
                <div className="border-b border-slate-200 py-3 dark:border-white/10">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    Add-ons
                  </p>
                  {seatCharges > 0 && (
                    <FareItem label="Seat Selection" amount={seatCharges} />
                  )}
                  {mealCharges > 0 && (
                    <FareItem label={`Meals (${(selectedMeals || []).length})`} amount={mealCharges} />
                  )}
                  {baggageCharges > 0 && (
                    <FareItem
                      label={`Extra Baggage (${selectedBaggage.reduce((sum, b) => sum + b.quantity, 0)} bags)`}
                      amount={baggageCharges}
                    />
                  )}
                  
                  {travelProtectionCharge > 0 && (
                    <FareItem label={`Travel Insurance x ${passengerCount}`} amount={travelProtectionCharge} />
                  )}
                </div>
              )}

              {/* Total */}
              <div className="pt-3">
                <FareItem
                  label="Grand Total"
                  amount={grandTotal}
                  highlight={true}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Promo Code Section */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/20 dark:bg-amber-500/10">
          <Tag className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300" />
          <input
            type="text"
            placeholder="Enter promo code"
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-500"
          />
          <button className="text-sm font-medium text-amber-700 transition-colors hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200">
            Apply
          </button>
        </div>
      </div>

      {/* CTA Button */}
      <div className="p-6 pt-0">
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Payment method</p>
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
                    ? 'border-blue-500 bg-blue-50 shadow-sm dark:border-blue-400/70 dark:bg-blue-500/10'
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
                      ? 'border-blue-600 bg-blue-600 ring-2 ring-blue-200 dark:ring-blue-500/30'
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
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-4 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
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
            <p className="text-xs text-slate-600 dark:text-slate-300">Secure</p>
          </div>
          <div className="rounded-md bg-slate-50 p-2 dark:bg-white/5">
            <p className="text-xs text-slate-600 dark:text-slate-300">Instant</p>
          </div>
          <div className="rounded-md bg-slate-50 p-2 dark:bg-white/5">
            <p className="text-xs text-slate-600 dark:text-slate-300">Verified</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FareSummaryCard;
