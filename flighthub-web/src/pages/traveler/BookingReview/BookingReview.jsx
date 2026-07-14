import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Plane,
  ShieldCheck,
  Users,
} from "lucide-react";
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
import { releaseSeatInstances } from "@/Redux/seat/seatThunk";

import { getFareRuleByFare } from "@/Redux/fareRules/fareRulesThunk";
import { fetchFlightMealsByFlightId } from "@/Redux/flightMeal/flightMealThunk";
import { getBaggagePolicyByFare } from "@/Redux/baggagePolicy/baggagePolicyThunk";
import { getFareById } from "@/Redux/fare/fareThunk";
import api from "@/utils/api";

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

const decodeJsonParam = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(atob(value));
  } catch {
    return null;
  }
};

const readStoredMultiCityDraft = () => {
  try {
    return JSON.parse(sessionStorage.getItem("multiCityDraft") || "null");
  } catch {
    return null;
  }
};

const getSelectedTravelProtection = (payload) => {
  if (Array.isArray(payload)) return payload[0] || null;
  return payload || null;
};

const getPaidAddOnAmount = (item, quantity = 1) => {
  if (!item || item.includedInFare) return 0;
  const value = item.price ?? item.totalPrice ?? item.ancillary?.price ?? 0;
  return (Number.isFinite(Number(value)) ? Number(value) : 0) * quantity;
};

const getFareAmount = (fare, field, fallbackField) => {
  const value = fare?.[field] ?? fare?.[fallbackField] ?? 0;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
};

const unwrapApiData = (response) => response?.data?.data ?? response?.data;

const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parsePaxTypeCount = (value) => {
  if (!value || typeof value !== "string") return null;

  const adultMatch = value.match(/A-(\d+)/i);
  const childMatch = value.match(/C-(\d+)/i);
  const infantMatch = value.match(/I-(\d+)/i);
  const adults = parsePositiveInt(adultMatch?.[1]) || 0;
  const children = parsePositiveInt(childMatch?.[1]) || 0;
  const infants = parsePositiveInt(infantMatch?.[1]) || 0;
  const total = adults + children + infants;

  return total > 0 ? total : null;
};

const mealQuantity = (meal) => Math.max(Number(meal?.quantity) || 1, 1);

const SectionLabel = ({ eyebrow, title, description }) => (
  <div className="mb-3">
    <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-300">
      {eyebrow}
    </p>
    <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
      {title}
    </h2>
    {description && (
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>
    )}
  </div>
);

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

  const { loading: bookingLoading } = useSelector(
    (state) => state.booking,
  );

  // State management
  const [travellerData, setTravellerData] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]); // Changed to array for multiple passengers
  const [seatHold, setSeatHold] = useState(null);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [selectedBaggage, setSelectedBaggage] = useState([]);
  const [paymentGateway, setPaymentGateway] = useState("STRIPE");
  const [promoCode, setPromoCode] = useState(searchParams.get("promoCode") || "");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [travellerValidationAttempted, setTravellerValidationAttempted] = useState(false);
  const [returnFlightInstance, setReturnFlightInstance] = useState(null);
  const [returnFare, setReturnFare] = useState(null);
  const [multiCityFlightInstances, setMultiCityFlightInstances] = useState([]);
  const [multiCityFares, setMultiCityFares] = useState([]);

  const [selectedTravelProtection, setSelectedTravelProtection] = useState(null);

  const bookingParams = useMemo(() => {
    const storedBookingData = readStoredBookingData();
    const storedMultiCityDraft = readStoredMultiCityDraft();
    const decodedFilter = decodeSearchFilter(searchParams.get("xflt"));
    const decodedMultiLegs = decodeJsonParam(searchParams.get("multiLegs"));
    const storedFare = storedBookingData?.fare || {};
    const storedCabin = storedBookingData?.flight?.selectedCabinClass || {};
    const storedMultiLegs = Array.isArray(storedMultiCityDraft?.legs)
      ? storedMultiCityDraft.legs.map((legSelection, index) => ({
          legOrder: index + 1,
          flightId: legSelection?.queryParams?.flightId,
          flightInstanceId: legSelection?.queryParams?.flightInstanceId,
          fareId: legSelection?.queryParams?.fareId,
          cabinClass: legSelection?.queryParams?.cabinClass,
          cabinClassId: legSelection?.queryParams?.cabinClassId,
          selectedFare: legSelection?.selectedFare,
          flight: legSelection?.flight,
        }))
      : [];
    const multiLegs = Array.isArray(decodedMultiLegs) && decodedMultiLegs.length
      ? decodedMultiLegs
      : storedMultiLegs;
    const passengerCount =
      parsePositiveInt(searchParams.get("pax")) ||
      parsePositiveInt(searchParams.get("passengers")) ||
      parsePositiveInt(searchParams.get("numberOfTravellers")) ||
      parsePositiveInt(storedBookingData?.numberOfTravellers) ||
      parsePaxTypeCount(decodedFilter.PaxType || decodedFilter.p) ||
      1;

    return {
      passengerCount,
      totalPassengers: passengerCount,
      flightId: searchParams.get("flightId") || decodedFilter.flightId || storedBookingData?.flight?.flightId,
      fareId: searchParams.get("fareId") || decodedFilter.fareId || storedFare.id,
      flightInstanceId: searchParams.get("flightInstanceId") || decodedFilter.flightInstanceId || storedBookingData?.flight?.id,
      cabinClass: searchParams.get("cabinClass") || decodedFilter.CabinClass || storedCabin.name || storedFare.cabinClass || "ECONOMY",
      cabinClassId: searchParams.get("cabinClassId") || decodedFilter.cabinClassId || storedFare.cabinClassId || storedCabin.id,
      tripType: searchParams.get("tripType") || "ONE_WAY",
      returnFlightId: searchParams.get("returnFlightId"),
      returnFlightInstanceId: searchParams.get("returnFlightInstanceId"),
      returnFareId: searchParams.get("returnFareId"),
      returnCabinClass: searchParams.get("returnCabinClass"),
      returnCabinClassId: searchParams.get("returnCabinClassId"),
      multiLegs,
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
    returnFlightId,
    returnFlightInstanceId,
    returnFareId,
    returnCabinClass,
    returnCabinClassId,
    multiLegs,
  } = bookingParams;
  const travelProtectionPackage = getSelectedTravelProtection(
    ancillariesByType?.TRAVEL_PROTECTION,
  );
  const selectedSeatCount = selectedSeats.filter(Boolean).length;
  const selectedBaggageCount = selectedBaggage.reduce(
    (sum, bag) => sum + (Number(bag.quantity) || 0),
    0,
  );
  const isRoundTrip = tripType === "ROUND_TRIP" && Boolean(returnFlightInstanceId);
  const isMultiCity = tripType === "MULTI_CITY" && Array.isArray(multiLegs) && multiLegs.length > 1;
  const itineraryFlightData = useMemo(
    () => {
      if (isMultiCity) {
        return [flightInstance, ...multiCityFlightInstances].filter(Boolean);
      }
      return isRoundTrip ? [flightInstance, returnFlightInstance].filter(Boolean) : flightInstance;
    },
    [flightInstance, isMultiCity, isRoundTrip, multiCityFlightInstances, returnFlightInstance],
  );
  const fareItems = useMemo(() => {
    if (isMultiCity) {
      return multiLegs.map((leg, index) => ({
        label: `Flight ${index + 1} fare`,
        fare: index === 0 ? (selectedFare || leg.selectedFare) : (multiCityFares[index - 1] || leg.selectedFare),
      })).filter((item) => item.fare);
    }

    const items = [];
    if (selectedFare) {
      items.push({ label: isRoundTrip ? "Outbound fare" : "Flight fare", fare: selectedFare });
    }
    if (isRoundTrip && returnFare) {
      items.push({ label: "Return fare", fare: returnFare });
    }
    return items;
  }, [isMultiCity, isRoundTrip, multiCityFares, multiLegs, returnFare, selectedFare]);
  const routeSummary = isMultiCity
    ? `${multiLegs.length} flight itinerary`
    : isRoundTrip
    ? `${flightInstance?.departureAirport?.iataCode || flightInstance?.flight?.departureAirport?.iataCode || "Outbound"} + return`
    : flightInstance
      ? `${flightInstance.departureAirport?.iataCode || flightInstance.flight?.departureAirport?.iataCode || "From"} to ${
          flightInstance.arrivalAirport?.iataCode || flightInstance.flight?.arrivalAirport?.iataCode || "To"
        }`
      : "Flight selected";
  const checkoutSteps = [
    {
      label: "Flight",
      value: routeSummary,
      icon: Plane,
      complete: Boolean(flightInstanceId),
    },
    {
      label: "Travellers",
      value: `${passengerCount} passenger${passengerCount > 1 ? "s" : ""}`,
      icon: Users,
      complete: Boolean(travellerData?.passengers?.length === passengerCount),
    },
    {
      label: "Add-ons",
      value: `${selectedSeatCount} seats | ${selectedBaggageCount} bags | ${selectedMeals.reduce((sum, meal) => sum + mealQuantity(meal), 0)} meals`,
      icon: ShieldCheck,
      complete:
        selectedSeatCount > 0 ||
        selectedBaggageCount > 0 ||
        selectedMeals.length > 0 ||
        Boolean(selectedTravelProtection),
    },
  ];

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
      (sum, meal) => sum + (meal.price || 0) * mealQuantity(meal),
      0,
    );
    const baggageCharges = selectedBaggage.reduce(
      (sum, bag) => sum + getPaidAddOnAmount(bag, Number(bag.quantity) || 0),
      0,
    );
    const travelProtectionCharge = getPaidAddOnAmount(selectedTravelProtection);
    const baseFare = fareItems.reduce(
      (sum, item) => sum + getFareAmount(item.fare, "baseFare", "price") * passengerCount,
      0,
    );
    const taxes = fareItems.reduce(
      (sum, item) => sum + getFareAmount(item.fare, "taxes", "taxesAndFees") * passengerCount,
      0,
    );

    const grossTotal =
      baseFare +
      taxes +
      seatCharges +
      mealCharges +
      baggageCharges +
      travelProtectionCharge * passengerCount;
    const discountAmount = Math.min(Number(appliedCoupon?.discountAmount || 0), grossTotal);

    return {
      seatCharges,
      mealCharges,
      baggageCharges,
      travelProtectionCharge: travelProtectionCharge * passengerCount,
      grossTotal,
      discountAmount,
      grandTotal: Math.max(grossTotal - discountAmount, 0),
    };
  }, [appliedCoupon, fareItems, passengerCount, selectedBaggage, selectedMeals, selectedSeats, selectedTravelProtection]);

  useEffect(() => {
    setAppliedCoupon(null);
  }, [cabinClass, pricingSummary.grossTotal]);

  const handleApplyPromo = async (code) => {
    const normalizedCode = String(code || "").trim().toUpperCase();
    if (!normalizedCode) {
      setPromoCode("");
      setAppliedCoupon(null);
      return;
    }

    const airlineId =
      fareItems[0]?.fare?.airlineId ||
      selectedFare?.airlineId ||
      flightInstance?.airlineId ||
      flightInstance?.flight?.airlineId ||
      flightInstance?.flight?.airline?.id;

    if (!airlineId) {
      toast.error("Unable to validate promo code because airline information is missing.");
      return;
    }

    setPromoLoading(true);
    try {
      const response = await api.post("/api/coupons/validate", {
        code: normalizedCode,
        airlineId,
        cabinClass,
        bookingAmount: pricingSummary.grossTotal,
      });
      const coupon = response?.data?.data ?? response?.data;
      setPromoCode(normalizedCode);
      setAppliedCoupon(coupon);
      toast.success("Promo code applied", {
        description: `${normalizedCode} saved ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(Number(coupon?.discountAmount || 0))}.`,
      });
    } catch (error) {
      setAppliedCoupon(null);
      toast.error("Promo code is not valid for this booking", {
        description:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Please check the code, route, cabin, and minimum spend.",
      });
    } finally {
      setPromoLoading(false);
    }
  };

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

  useEffect(() => {
    if (fareId) {
      dispatch(getBaggagePolicyByFare(fareId));
      dispatch(getFareRuleByFare(fareId));
      dispatch(getFareById(fareId));
    }
  }, [fareId, dispatch]);

  useEffect(() => {
    let cancelled = false;

    if (!isRoundTrip || !returnFareId) {
      setReturnFare(null);
      return undefined;
    }

    const loadReturnFare = async () => {
      try {
        const response = await api.get(`/api/fares/${returnFareId}`);
        if (!cancelled) setReturnFare(unwrapApiData(response));
      } catch {
        if (!cancelled) {
          setReturnFare(null);
          toast.error("Could not load return fare details. Please select the return flight again.");
        }
      }
    };

    loadReturnFare();

    return () => {
      cancelled = true;
    };
  }, [isRoundTrip, returnFareId]);

  useEffect(() => {
    let cancelled = false;

    if (!isMultiCity) {
      setMultiCityFares([]);
      return undefined;
    }

    const loadMultiCityFares = async () => {
      const extraLegs = multiLegs.slice(1);
      const fares = await Promise.all(
        extraLegs.map(async (leg) => {
          if (leg.selectedFare) return leg.selectedFare;
          if (!leg.fareId) return null;
          try {
            const response = await api.get(`/api/fares/${leg.fareId}`);
            return unwrapApiData(response);
          } catch {
            return null;
          }
        }),
      );

      if (!cancelled) {
        setMultiCityFares(fares);
        if (fares.some((fare) => !fare)) {
          toast.error("Could not load all multi-city fare details. Please select the itinerary again.");
        }
      }
    };

    loadMultiCityFares();

    return () => {
      cancelled = true;
    };
  }, [isMultiCity, multiLegs]);

  // Fetch flight instance data when flightInstanceId is available
  useEffect(() => {
    if (flightInstanceId) {
      dispatch(getFlightInstanceById(flightInstanceId));
    }
  }, [flightInstanceId, dispatch]);

  useEffect(() => {
    let cancelled = false;

    if (!isRoundTrip || !returnFlightInstanceId) {
      setReturnFlightInstance(null);
      return undefined;
    }

    const loadReturnFlightInstance = async () => {
      try {
        const response = await api.get(`/api/flight-instances/${returnFlightInstanceId}`);
        if (!cancelled) setReturnFlightInstance(unwrapApiData(response));
      } catch {
        if (!cancelled) {
          setReturnFlightInstance(null);
          toast.error("Could not load return flight details. Please select the return flight again.");
        }
      }
    };

    loadReturnFlightInstance();

    return () => {
      cancelled = true;
    };
  }, [isRoundTrip, returnFlightInstanceId]);

  useEffect(() => {
    let cancelled = false;

    if (!isMultiCity) {
      setMultiCityFlightInstances([]);
      return undefined;
    }

    const loadMultiCityFlightInstances = async () => {
      const extraLegs = multiLegs.slice(1);
      const flightInstances = await Promise.all(
        extraLegs.map(async (leg) => {
          if (leg.flight) return leg.flight;
          if (!leg.flightInstanceId) return null;
          try {
            const response = await api.get(`/api/flight-instances/${leg.flightInstanceId}`);
            return unwrapApiData(response);
          } catch {
            return null;
          }
        }),
      );

      if (!cancelled) {
        setMultiCityFlightInstances(flightInstances.filter(Boolean));
        if (flightInstances.some((instance) => !instance)) {
          toast.error("Could not load all multi-city flight details. Please select the itinerary again.");
        }
      }
    };

    loadMultiCityFlightInstances();

    return () => {
      cancelled = true;
    };
  }, [isMultiCity, multiLegs]);

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
    if (!flightId || !flightInstanceId || !fareId) {
      toast.error("Missing flight or fare information. Please go back and select the flight again.");
      return;
    }

    if (isRoundTrip && (!returnFlightId || !returnFlightInstanceId || !returnFareId || !returnFare)) {
      toast.error("Missing return flight or fare information. Please go back and select the return flight again.");
      return;
    }

    if (isMultiCity && multiLegs.length < 2) {
      toast.error("Missing multi-city flight information. Please go back and select every flight again.");
      return;
    }

    if (isMultiCity && fareItems.length !== multiLegs.length) {
      toast.error("Missing multi-city fare information. Please go back and select every fare again.");
      return;
    }

    // Validate traveller data
    const passengers = travellerData?.passengers || [];
    const contactInfo = travellerData?.contactInfo || {};
    const isAllTravellersComplete =
      passengers.length === passengerCount &&
      passengers.every(
        (t) => t.title && t.firstName && t.lastName && t.gender && t.dob,
      );

    if (!isAllTravellersComplete) {
      setTravellerValidationAttempted(true);
      return;
    }

    if (!contactInfo.email || !contactInfo.phone) {
      setTravellerValidationAttempted(true);
      return;
    }

    setTravellerValidationAttempted(false);

    if (selectedSeatCount > 0 && selectedSeatCount !== passengerCount) {
      toast.error(
        `Please select seats for all ${passengerCount} passenger(s), or remove the selected seat(s) to continue without seat selection`,
      );
      return;
    }

    if (selectedSeatCount > 0 && !seatHold?.holdToken) {
      toast.error("Your seat hold is not active. Please reselect your seats.");
      return;
    }

    if (promoCode.trim() && !appliedCoupon?.code) {
      toast.error("Please apply the promo code before proceeding to payment.");
      return;
    }

    // Calculate totals for summary - sum up all seats for multiple passengers
    const seatCharges = selectedSeats.reduce(
      (sum, seat) => sum + (seat?.price || 0),
      0,
    );
    const mealCharges = selectedMeals.reduce(
      (sum, meal) => sum + (meal.price || 0) * mealQuantity(meal),
      0,
    );
    const baggageCharges = selectedBaggage.reduce(
      (sum, bag) => sum + getPaidAddOnAmount(bag, Number(bag.quantity) || 0),
      0,
    );

    const travelProtectionData = travelProtectionPackage;
    const travelProtectionCharge = getPaidAddOnAmount(selectedTravelProtection);


    const baseFare = fareItems.reduce(
      (sum, item) => sum + getFareAmount(item.fare, "baseFare", "price") * passengerCount,
      0,
    );
    const taxes = fareItems.reduce(
      (sum, item) => sum + getFareAmount(item.fare, "taxes", "taxesAndFees") * passengerCount,
      0,
    );
    const subtotal = baseFare + taxes;
    const addOnsTotal =
      seatCharges +
      mealCharges +
      baggageCharges +
      travelProtectionCharge * passengerCount;
    const grossTotal = subtotal + addOnsTotal;
    const discountAmount = Math.min(Number(appliedCoupon?.discountAmount || 0), grossTotal);
    const grandTotal = Math.max(grossTotal - discountAmount, 0);

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
      if (meal.flightMealId) {
        for (let index = 0; index < mealQuantity(meal); index += 1) {
          mealIds.push(meal.flightMealId);
        }
      }
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

    const expandedSelectedMeals = selectedMeals.flatMap((meal) =>
      Array.from({ length: mealQuantity(meal) }, () => meal),
    );

    // Get dietary preferences from selected meals
    const getDietaryPreference = (passengerIndex) => {
      const passengerMeal = expandedSelectedMeals[passengerIndex];
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
    const bookingLegs = isMultiCity
      ? multiLegs.map((leg, index) => ({
          legOrder: index + 1,
          flightId: parseInt(leg.flightId) || null,
          flightInstanceId: parseInt(leg.flightInstanceId) || null,
          fareId: parseInt(leg.fareId) || null,
          cabinClass: leg.cabinClass || cabinClass,
          seatInstanceIds: index === 0 ? selectedSeats.filter(Boolean).map((seat) => seat.id) : [],
          seatHoldToken: index === 0 && selectedSeatCount > 0 ? seatHold?.holdToken : null,
        }))
      : [
          {
            legOrder: 1,
            flightId: parseInt(flightId) || null,
            flightInstanceId: parseInt(flightInstanceId) || null,
            fareId: parseInt(fareId) || null,
            cabinClass,
            seatInstanceIds: selectedSeats.filter(Boolean).map((seat) => seat.id),
            seatHoldToken: selectedSeatCount > 0 ? seatHold?.holdToken : null,
          },
          ...(tripType === "ROUND_TRIP" && returnFlightId && returnFlightInstanceId && returnFareId
            ? [{
                legOrder: 2,
                flightId: parseInt(returnFlightId) || null,
                flightInstanceId: parseInt(returnFlightInstanceId) || null,
                fareId: parseInt(returnFareId) || null,
                cabinClass: returnCabinClass || cabinClass,
                seatInstanceIds: [],
                seatHoldToken: null,
              }]
            : []),
        ];

    const bookingDataForAPI = {
      flightId: parseInt(flightId) || null,
      flightInstanceId: parseInt(flightInstanceId) || null,
      cabinClass,
      tripType,
      fareId: parseInt(fareId) || null,
      legs: bookingLegs,
      passengers: passengers.map((t, index) => ({
        firstName: t.firstName || "",
        lastName: t.lastName || "",
        email: t.email || contactInfo.email || "",
        phone: t.phone
          ? `${t.countryCode || contactInfo.countryCode || "+1"}${t.phone}`
          : `${contactInfo.countryCode || "+1"}${contactInfo.phone}`,
        dateOfBirth: t.dob || null,
        gender: t.gender ? t.gender.toUpperCase() : null,
        seatNumber: selectedSeats[index]
          ? selectedSeats[index].seatNumber
          : null,
        seatInstanceId: selectedSeats[index] ? selectedSeats[index].id : null,
        passportNumber: t.passportNumber || null,
        nationality: t.nationality || null,
        frequentFlyerNumber: t.frequentFlyerNumber || null,
        requiresWheelchairAssistance: t.requiresWheelchairAssistance || false,
        dietaryPreferences: getDietaryPreference(index),
        medicalConditions: t.medicalConditions || null,
      })),
      contactInfo,
      ancillaryIds: ancillaryIds,
      mealIds: mealIds,
      promoCode: appliedCoupon?.code || null,
      seatNumbers: seatNumbers,
      seatHoldToken: selectedSeatCount > 0 ? seatHold?.holdToken : null,
      seatHoldExpiresAt: selectedSeatCount > 0 ? seatHold?.holdExpiresAt : null,
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
      if (seatHold?.holdToken && selectedSeatCount > 0) {
        dispatch(
          releaseSeatInstances({
            seatInstanceIds: selectedSeats.filter(Boolean).map((seat) => seat.id),
            holdToken: seatHold.holdToken,
          }),
        );
        setSeatHold(null);
      }
      toast.error(`Booking failed: ${error || "Please try again"}`, {
        id: "booking-toast",
      });
    }
  };

  return (
    <div className="app-page-surface min-h-screen text-slate-950 dark:text-white">
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
                  Review passenger details, add optional services, and confirm payment.
                </p>
              </div>
              <div className="grid gap-2 text-left sm:grid-cols-3">
                {checkoutSteps.map(({ label, value, icon: Icon, complete }) => (
                  <div
                    key={label}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900/70"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      {complete ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-300" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-950 dark:text-white">{label}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 gap-6 [&_.bg-gray-50]:dark:bg-slate-950/50 [&_.bg-gray-100]:dark:bg-slate-800 [&_.bg-white]:dark:bg-slate-900/90 [&_.border-gray-200]:dark:border-white/10 [&_.border-gray-300]:dark:border-white/10 [&_.text-gray-500]:dark:text-slate-500 [&_.text-gray-600]:dark:text-slate-400 [&_.text-gray-700]:dark:text-slate-300 [&_.text-gray-800]:dark:text-white [&_.text-gray-900]:dark:text-white [&_input]:dark:border-white/10 [&_input]:dark:bg-slate-900 [&_input]:dark:text-white [&_select]:dark:border-white/10 [&_select]:dark:bg-slate-900 [&_select]:dark:text-white lg:grid-cols-3">
            {/* Left Column - Main Content */}
            <div className="col-span-1 space-y-6 lg:col-span-2">
              <SectionLabel
                eyebrow="Step 1"
                title="Flight review"
                description="Confirm your itinerary, cabin, and schedule before adding passenger details."
              />
              <FlightDetailsOverview flightData={itineraryFlightData} />

              <SectionLabel
                eyebrow="Step 2"
                title="Passenger information"
                description="Add traveller names and the booking contact used for confirmations and flight updates."
              />
              <TravellerDetailsForm
                passengerCount={passengerCount}
                onTravellerDataChange={setTravellerData}
                validationAttempted={travellerValidationAttempted}
              />

              <SectionLabel
                eyebrow="Step 3"
                title="Customize your trip"
                description="Seats and add-ons are optional. Unavailable services are skipped cleanly."
              />
              <div className="space-y-6">
                <SeatSelection
                  selectedSeats={selectedSeats}
                  onSelectSeat={handleSeatSelection}
                  seatHold={seatHold}
                  onSeatHoldChange={setSeatHold}
                  passengerCount={passengerCount}
                  flightInstanceId={flightInstanceId}
                  cabinClassId={selectedFare?.cabinClassId || cabinClassId}
                  cabinClass={cabinClass}
                  tripType={tripType}
                  routeLabel={isRoundTrip || isMultiCity ? "first flight" : "this flight"}
                />

                <BaggageSelection
                  selectedBaggage={selectedBaggage}
                  onSelectBaggage={setSelectedBaggage}
                />

      <MealSelection
                  selectedMeals={selectedMeals}
                  onSelectMeal={setSelectedMeals}
                  totalPassengers={passengerCount}
                />

                <TripSecure
                  selectedTravelProtection={selectedTravelProtection}
                  onSelectTravelProtection={setSelectedTravelProtection}
                />
              </div>

              <SectionLabel
                eyebrow="Step 4"
                title="Policies and travel notes"
                description="Review fare conditions and operational reminders before payment."
              />
              <CancellationAndDateChangePolicy />
              <ImportantInformation />
            </div>

            {/* Right Column - Fare Summary (Sticky) */}
            <div className="col-span-1">
              <div className="sticky top-24">
                <FareSummaryCard
                  fareData={selectedFare}
                  fareItems={fareItems}
                  selectedSeats={selectedSeats}
                  selectedMeals={selectedMeals}
                  selectedBaggage={selectedBaggage}
                  travelProtection={selectedTravelProtection}
                  paymentGateway={paymentGateway}
                  onPaymentGatewayChange={setPaymentGateway}
                  promoCode={promoCode}
                  appliedCoupon={appliedCoupon}
                  promoLoading={promoLoading}
                  onPromoCodeChange={(value) => {
                    setPromoCode(value);
                    setAppliedCoupon(null);
                  }}
                  onApplyPromo={handleApplyPromo}
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
