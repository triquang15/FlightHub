import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, X, AlertCircle, ShieldCheck, Users, Plane } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

// Import components
import FlightDetailsOverview from "./FlightDetailsOverview";
import TravellerDetailsForm from "./TravellerDetailsForm";
import SeatSelection from "./SeatSelection";
import MealSelection from "./MealSelection";
import BaggageSelection from "./BaggageSelection";
import CancellationAndDateChangePolicy from "./CancellationAndDateChangePolicy";

import TripSecure from "./TripSecure";
import ImportantInformation from "./ImportantInformation";
import FareSummaryCard from "./FareSummaryCard";

// Import Redux thunks
import {
  getAllFlightCabinAncillariesByType,
} from "@/Redux/flightCabinAncillary/flightCabinAncillaryThunk";
import { getFlightInstanceById } from "@/Redux/flightInstance/flightInstanceThunk";
import { createBooking } from "@/Redux/booking/bookingThunk";

import { getFareRuleByFare } from "@/Redux/fareRules/fareRulesThunk";
import { fetchFlightMealsByFlightId } from "@/Redux/flightMeal/flightMealThunk";
import { getBaggagePolicyByFare } from "@/Redux/baggagePolicy/baggagePolicyThunk";
import { getFareById } from "@/Redux/fare/fareThunk";

const readStoredBookingData = () => {
  try {
    return JSON.parse(sessionStorage.getItem("bookingData") || "null");
  } catch {
    return null;
  }
};

const decodeSearchFilter = (value) => {
  if (!value) return {};
  try {
    return JSON.parse(atob(value));
  } catch {
    return {};
  }
};

const getSelectedTravelProtection = (payload) => {
  if (Array.isArray(payload)) return payload[0] || null;
  return payload || null;
};

const getFareAmount = (fare, field, fallbackField) => {
  const value = fare?.[field] ?? fare?.[fallbackField] ?? 0;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
};

const BookingReview = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const { fare: selectedFare } = useSelector((store) => store.fare);
  const { flightInstance } = useSelector((store) => store.flightInstance);

  // Redux state
  const { ancillariesByType } = useSelector(
    (state) => state.flightCabinAncillary,
  );
  const { seats = [] } = useSelector((state) => state.seat || {});

  const { loading: bookingLoading, error: bookingError } = useSelector(
    (state) => state.booking,
  );

  // State management
  const [travellerData, setTravellerData] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]); // Changed to array for multiple passengers
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [selectedBaggage, setSelectedBaggage] = useState([]);
  const [paymentGateway, setPaymentGateway] = useState("STRIPE");

  const [selectedTravelProtection, setSelectedTravelProtection] = useState(null);

  const [loading, setLoading] = useState(true);
  const bookingParams = useMemo(() => {
    const storedBookingData = readStoredBookingData();
    const decodedFilter = decodeSearchFilter(searchParams.get("xflt"));
    const passengerCount = parseInt(
      searchParams.get("pax") || searchParams.get("passengers") || searchParams.get("numberOfTravellers"),
      10,
    ) || 1;
    const storedFare = storedBookingData?.fare || {};
    const storedCabin = storedBookingData?.flight?.selectedCabinClass || {};

    return {
      passengerCount,
      totalPassengers: passengerCount,
      flightId: searchParams.get("flightId") || decodedFilter.flightId || storedBookingData?.flight?.flightId,
      fareId: searchParams.get("fareId") || decodedFilter.fareId || storedFare.id,
      flightInstanceId: searchParams.get("flightInstanceId") || decodedFilter.flightInstanceId || storedBookingData?.flight?.id,
      cabinClass: searchParams.get("cabinClass") || decodedFilter.CabinClass || storedCabin.name || storedFare.cabinClass || "ECONOMY",
      cabinClassId: searchParams.get("cabinClassId") || decodedFilter.cabinClassId || storedFare.cabinClassId || storedCabin.id,
      tripType: searchParams.get("tripType") || "ONE_WAY",
    };
  }, [searchParams]);

  const {
    passengerCount,
    totalPassengers,
    flightId,
    fareId,
    flightInstanceId,
    cabinClass,
    cabinClassId,
    tripType,
  } = bookingParams;

  // Helper function to calculate seat price
  const getSeatPrice = (seat) => {
    if (!seat) return 0;
    const value =
      seat.price ??
      seat.fare ??
      seat.seat?.totalPrice ??
      seat.seat?.premiumSurcharge ??
      seat.premiumSurcharge ??
      0;

    return Number.isFinite(Number(value)) ? Number(value) : 0;
  };

  const pricingSummary = useMemo(() => {
    const seatCharges = selectedSeats.reduce(
      (sum, seat) => sum + (seat?.price || 0),
      0,
    );
    const mealCharges = selectedMeals.reduce(
      (sum, meal) => sum + (meal.price || 0),
      0,
    );
    const baggageCharges = selectedBaggage.reduce(
      (sum, bag) => sum + (bag.price || 0) * (bag.quantity || 0),
      0,
    );
    const travelProtectionCharge = selectedTravelProtection?.price || 0;
    const baseFare = getFareAmount(selectedFare, "baseFare", "price") * passengerCount;
    const taxes = getFareAmount(selectedFare, "taxes", "taxesAndFees") * passengerCount;

    return {
      seatCharges,
      mealCharges,
      baggageCharges,
      travelProtectionCharge: travelProtectionCharge * passengerCount,
      grandTotal:
        baseFare +
        taxes +
        seatCharges +
        mealCharges +
        baggageCharges +
        travelProtectionCharge * passengerCount,
    };
  }, [passengerCount, selectedBaggage, selectedFare, selectedMeals, selectedSeats, selectedTravelProtection]);

  // Handle seat selection with price calculation for multiple passengers
  const handleSeatSelection = (passengerIndex, seat) => {
    const updatedSeats = [...selectedSeats];

    if (seat) {
      updatedSeats[passengerIndex] = {
        ...seat,
        price: getSeatPrice(seat),
      };
    } else {
      updatedSeats[passengerIndex] = null;
    }
    setSelectedSeats(updatedSeats);
  };

  useEffect(() => {
    // Keep seat slots aligned with the selected passenger count.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSeats((current) =>
      Array.from({ length: passengerCount }, (_, index) => current[index] || null),
    );
  }, [passengerCount]);

  // Load booking data from URL parameters and sessionStorage
  useEffect(() => {
    try {
      decodeSearchFilter(searchParams.get("xflt"));
      readStoredBookingData();
    } catch (error) {
      console.error("Error loading booking data:", error);
    } finally {
      setLoading(false);
    }
  }, [searchParams, passengerCount, cabinClass, fareId, flightId, flightInstanceId]);

  useEffect(() => {
    if (fareId) {
      dispatch(getBaggagePolicyByFare(fareId));
      dispatch(getFareRuleByFare(fareId));
      dispatch(getFareById(fareId));
    }
  }, [fareId, dispatch]);

  // Fetch flight instance data when flightInstanceId is available
  useEffect(() => {
    if (flightInstanceId) {
      dispatch(getFlightInstanceById(flightInstanceId));
    }
  }, [flightInstanceId, dispatch]);

  // Fetch ancillaries by type when flightId and cabinClassId are available
  useEffect(() => {
    if (flightId) {
      // fetch meals by flightId (not cabin-specific)
      dispatch(fetchFlightMealsByFlightId(flightId));
    }

    const resolvedCabinClassId = selectedFare?.cabinClassId || cabinClassId;
    if (flightId && resolvedCabinClassId) {


      // Fetch Travel Protection as a list so unavailable packages return 200 [] instead of a noisy 404.
      dispatch(
        getAllFlightCabinAncillariesByType({
          flightId,
          cabinClassId: resolvedCabinClassId,
          type: "TRAVEL_PROTECTION",
        }),
      );

      // Fetch Baggage
      dispatch(
        getAllFlightCabinAncillariesByType({
          flightId,
          cabinClassId: resolvedCabinClassId,
          type: "BAGGAGE",
        }),
      );
    }
  }, [cabinClassId, flightId, selectedFare?.cabinClassId, dispatch]);

  const handleProceedToPayment = async () => {
    // Validate traveller data
    const passengers = travellerData?.passengers || [];
    const contactInfo = travellerData?.contactInfo || {};
    const isAllTravellersComplete =
      passengers.length === passengerCount &&
      passengers.every(
        (t) => t.title && t.firstName && t.lastName && t.gender && t.dob,
      );

    if (!isAllTravellersComplete) {
      toast.error("Please fill all required traveller details, including date of birth");
      return;
    }

    if (!contactInfo.email || !contactInfo.phone) {
      toast.error("Please provide contact email and phone number");
      return;
    }

    const selectedSeatCount = selectedSeats.filter(Boolean).length;
    if (selectedSeatCount > 0 && selectedSeatCount !== passengerCount) {
      toast.error(
        `Please select seats for all ${passengerCount} passenger(s), or remove the selected seat(s) to continue without seat selection`,
      );
      return;
    }

    // Calculate totals for summary - sum up all seats for multiple passengers
    const seatCharges = selectedSeats.reduce(
      (sum, seat) => sum + (seat?.price || 0),
      0,
    );
    const mealCharges = selectedMeals.reduce(
      (sum, meal) => sum + (meal.price || 0),
      0,
    );
    const baggageCharges = selectedBaggage.reduce(
      (sum, bag) => sum + (bag.price || 0) * (bag.quantity || 0),
      0,
    );

    const travelProtectionData = getSelectedTravelProtection(
      ancillariesByType?.TRAVEL_PROTECTION,
    );
    const travelProtectionCharge =
      selectedTravelProtection?.price || travelProtectionData?.price || 0;


    const baseFare = getFareAmount(selectedFare, "baseFare", "price") * passengerCount;
    const taxes = getFareAmount(selectedFare, "taxes", "taxesAndFees") * passengerCount;
    const subtotal = baseFare + taxes;
    const addOnsTotal =
      seatCharges +
      mealCharges +
      baggageCharges +
      travelProtectionCharge * passengerCount;
    const grandTotal = subtotal + addOnsTotal;

    // Collect all ancillary IDs
    const ancillaryIds = [];

    // Add seat ancillary IDs for all passengers
    // selectedSeats.forEach((seat) => {
    //   if (seat?.id) {
    //     ancillaryIds.push(seat.id);
    //   }
    // });

    const mealIds = [];

    // Add meal ancillary IDs
    selectedMeals.forEach((meal) => {
      if (meal.flightMealId) mealIds.push(meal.flightMealId);
    });

    // Add baggage ancillary IDs
    selectedBaggage.forEach((bag) => {
      if (bag.id) {
        // Add multiple times based on quantity
        for (let i = 0; i < bag.quantity; i++) {
          ancillaryIds.push(bag.id);
        }
      }
    });

    // Add travel protection ancillary ID
    if (selectedTravelProtection && (selectedTravelProtection.id || travelProtectionData?.id)) {
      const travelProtectionId = selectedTravelProtection.id || travelProtectionData.id;
      for (let index = 0; index < passengerCount; index += 1) {
        ancillaryIds.push(travelProtectionId);
      }
    }




    // Get seat numbers array for all passengers
    const seatNumbers = selectedSeats
      .filter((seat) => seat !== null && seat !== undefined)
      .map((seat) => seat.seatNumber);

    // Get dietary preferences from selected meals
    const getDietaryPreference = (passengerIndex) => {
      const passengerMeal = selectedMeals[passengerIndex];
      if (passengerMeal?.dietaryRestriction) {
        const restrictions = {
          VEGETARIAN: "Vegetarian",
          VEGAN: "Vegan",
          HALAL: "Halal",
          KOSHER: "Kosher",
          GLUTEN_FREE: "Gluten Free",
        };
        return restrictions[passengerMeal.dietaryRestriction] || null;
      }
      return null;
    };

    // Backend API format booking data
    const bookingDataForAPI = {
      flightId: parseInt(flightId) || null,
      flightInstanceId: parseInt(flightInstanceId) || null,
      cabinClass,
      tripType,
      fareId: parseInt(fareId) || null,
      passengers: passengers.map((t, index) => ({
        firstName: t.firstName || "",
        lastName: t.lastName || "",
        email: t.email || contactInfo.email || "",
        phone: t.phone
          ? `${t.countryCode || contactInfo.countryCode || "+91"}${t.phone}`
          : `${contactInfo.countryCode || "+91"}${contactInfo.phone}`,
        dateOfBirth: t.dob || null,
        gender: t.gender ? t.gender.toUpperCase() : null,
        seatNumber: selectedSeats[index]
          ? selectedSeats[index].seatNumber
          : null,
        seatInstanceId: selectedSeats[index] ? selectedSeats[index].id : null,
        passportNumber: t.passportNumber || null,
        nationality: t.nationality || "IN",
        frequentFlyerNumber: t.frequentFlyerNumber || null,
        requiresWheelchairAssistance: t.requiresWheelchairAssistance || false,
        dietaryPreferences: getDietaryPreference(index),
        medicalConditions: t.medicalConditions || null,
      })),
      contactInfo,
      ancillaryIds: ancillaryIds,
      mealIds: mealIds,
      promoCode: searchParams.get("promoCode") || null,
      seatNumbers: seatNumbers,
      paymentGateway,
    };

    if (!seats.length) {
      bookingDataForAPI.seatNumbers = [];
      bookingDataForAPI.passengers = bookingDataForAPI.passengers.map((passenger) => ({
        ...passenger,
        seatNumber: null,
        seatInstanceId: null,
      }));
    }

    // Call the booking API
    try {
      toast.loading("Creating your booking...", { id: "booking-toast" });

      const result = await dispatch(createBooking(bookingDataForAPI)).unwrap();

      // Check for payment redirect URL
      const checkoutUrl = result.checkoutUrl || result.payment_link_url;

      if (checkoutUrl && result.success) {
        // Show redirecting message
        toast.success("Booking created! Redirecting to payment gateway...", {
          id: "booking-toast",
          duration: 3000,
        });
        // The thunk will handle the redirect
      } else if (result.success) {
        // No payment needed, booking confirmed
        toast.success(
          `Booking confirmed! Total: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(grandTotal)}\nBooking Reference: ${
            result.bookingReference || "N/A"
          }`,
          { id: "booking-toast", duration: 5000 },
        );
      } else {
        toast.error(result.message || "Booking failed. Please try again.", {
          id: "booking-toast",
        });
      }
    } catch (error) {
      console.error("❌ Booking failed:", error);
      toast.error(`Booking failed: ${error || "Please try again"}`, {
        id: "booking-toast",
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-300"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Use real booking data if available, otherwise use mock data

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      {/* Error Notification */}
      <AnimatePresence>
        {bookingError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed right-4 top-4 z-50 max-w-md"
          >
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-lg dark:border-red-500/30 dark:bg-red-950/70">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-300" />
                <div className="flex-1">
                  <h3 className="mb-1 text-sm font-semibold text-red-900 dark:text-red-100">
                    Booking Failed
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-200">{bookingError}</p>
                </div>
                <button
                  onClick={() =>
                    dispatch({ type: "booking/clearBookingError" })
                  }
                  className="text-red-400 transition-colors hover:text-red-600 dark:hover:text-red-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/85">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Flight Search</span>
            </button>
            <div className="hidden md:block">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Need help? Call:{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-300">
                  1800-123-4567
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Title */}
          <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-blue-600 dark:text-blue-300">
                  Secure checkout
                </p>
                <h1 className="mb-2 text-2xl font-bold text-slate-950 dark:text-white md:text-3xl">
              Complete Your Booking
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 md:text-base">
              Review your flight details and fill in traveller information
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Flight", icon: Plane },
                  { label: `${passengerCount} traveller${passengerCount > 1 ? "s" : ""}`, icon: Users },
                  { label: "Protected", icon: ShieldCheck },
                ].map(({ label, icon: Icon }) => (
                  <div key={label} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900/70">
                    <Icon className="mx-auto mb-1 h-4 w-4 text-blue-600 dark:text-blue-300" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 gap-6 [&_.bg-gray-50]:dark:bg-slate-950/50 [&_.bg-gray-100]:dark:bg-slate-800 [&_.bg-white]:dark:bg-slate-900/90 [&_.border-gray-200]:dark:border-white/10 [&_.border-gray-300]:dark:border-white/10 [&_.text-gray-500]:dark:text-slate-500 [&_.text-gray-600]:dark:text-slate-400 [&_.text-gray-700]:dark:text-slate-300 [&_.text-gray-800]:dark:text-white [&_.text-gray-900]:dark:text-white [&_input]:dark:border-white/10 [&_input]:dark:bg-slate-900 [&_input]:dark:text-white [&_select]:dark:border-white/10 [&_select]:dark:bg-slate-900 [&_select]:dark:text-white lg:grid-cols-3">
            {/* Left Column - Main Content */}
            <div className="col-span-1 space-y-6 lg:col-span-2">
              {/* 1. Flight Details Summary */}
              <FlightDetailsOverview flightData={flightInstance} />

              {/* Travel Insurance - Using real API data */}
              <TripSecure
                selectedTravelProtection={selectedTravelProtection}
                onSelectTravelProtection={setSelectedTravelProtection}
              />

              {/* 5. Cancellation & Date Change Policy - Using real API data */}
              <CancellationAndDateChangePolicy />

              {/* 2. Traveller Details Form */}
              <TravellerDetailsForm
                passengerCount={passengerCount}
                onTravellerDataChange={setTravellerData}
              />

              {/* 3. Add-ons Section */}
              <div className="space-y-6">
                {/* Seat Selection */}
                {/* Now using Redux data from flightInstance.seats and flightInstance.seatMap */}
                <SeatSelection
                  selectedSeats={selectedSeats}
                  onSelectSeat={handleSeatSelection}
                  passengerCount={passengerCount}
                  flightInstanceId={flightInstanceId}
                  cabinClassId={selectedFare?.cabinClassId || cabinClassId}
                  cabinClass={cabinClass}
                />

                {/* Meal Selection */}
                {/* Note: Meals are managed via separate Meal entity, not ancillaries */}
                {/* Now using Redux data from flightMeal store */}
                <MealSelection
                  selectedMeals={selectedMeals}
                  onSelectMeal={setSelectedMeals}
                />

                {/* Baggage Selection */}
                {/* Using Redux data from ancillariesByType.BAGGAGE */}
                <BaggageSelection
                  selectedBaggage={selectedBaggage}
                  onSelectBaggage={setSelectedBaggage}
                />

                {/* 6. Important Information */}
                <ImportantInformation />
              </div>
            </div>

            {/* Right Column - Fare Summary (Sticky) */}
            <div className="col-span-1">
              <div className="sticky top-24">
                <FareSummaryCard
                  fareData={selectedFare}
                  selectedSeats={selectedSeats}
                  selectedMeals={selectedMeals}
                  selectedBaggage={selectedBaggage}
                  travelProtection={selectedTravelProtection}
                  paymentGateway={paymentGateway}
                  onPaymentGatewayChange={setPaymentGateway}
                  onProceedToPayment={handleProceedToPayment}
                  isLoading={bookingLoading}
                  totalPassengers={totalPassengers}
                />
              </div>
            </div>
          </div>

          {/* Mobile Sticky Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-950/95 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Total Amount</p>
                <p className="text-lg font-bold text-slate-950 dark:text-white">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(pricingSummary.grandTotal)}
                </p>
              </div>
              <button
                onClick={handleProceedToPayment}
                disabled={bookingLoading}
                className="flex max-w-xs flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bookingLoading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Continue
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Add padding at bottom for mobile sticky bar */}
          <div className="lg:hidden h-24"></div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingReview;
