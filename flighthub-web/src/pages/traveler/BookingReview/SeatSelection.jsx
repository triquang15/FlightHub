import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, X, Check, Sparkles, ChevronRight, Info, Plane, User, RefreshCw, Ban } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  fetchSeatInstancesByFlightInstance,
  holdSeatInstances,
  releaseSeatInstances,
} from '@/Redux/seat/seatThunk';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const SeatSelection = ({
  selectedSeats = [],
  onSelectSeat,
  seatHold,
  onSeatHoldChange,
  passengerCount = 1,
  flightInstanceId,
  cabinClassId,
  cabinClass,
  tripType,
  routeLabel = 'Outbound flight',
}) => {
  const dispatch = useDispatch();
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);

  const { flightInstance, loading } = useSelector((state) => state.flightInstance);
  const {
    seats = [],
    loading: seatsLoading,
    holdLoading,
    error: seatError,
  } = useSelector((state) => state.seat || {});
  const currentUser = useSelector((state) => state.auth?.user);

  useEffect(() => {
    if (flightInstanceId) {
      dispatch(fetchSeatInstancesByFlightInstance(flightInstanceId));
    }
  }, [dispatch, flightInstanceId]);

  const visibleSeats = useMemo(() => {
    const normalizedCabin = cabinClass?.toString().toUpperCase();

    return seats.filter((seat) => {
      if (cabinClassId && Number(seat.seat?.cabinClassId) === Number(cabinClassId)) {
        return true;
      }

      if (!normalizedCabin) return true;

      return (
        seat.flightCabinClassType?.toString().toUpperCase() === normalizedCabin ||
        seat.seat?.cabinClassName?.toString().toUpperCase() === normalizedCabin
      );
    });
  }, [cabinClass, cabinClassId, seats]);

  const seatsByRow = useMemo(() => {
    return visibleSeats.reduce((acc, seat) => {
      const rowNumber = parseInt(seat.seatNumber?.match(/\d+/)?.[0] || '0', 10);
      if (!acc[rowNumber]) acc[rowNumber] = [];
      acc[rowNumber].push(seat);
      return acc;
    }, {});
  }, [visibleSeats]);

  const sortedRows = useMemo(() => {
    return Object.entries(seatsByRow)
      .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
      .map(([row, rowSeats]) => [
        row,
        [...rowSeats].sort((a, b) => {
          const letterA = a.seatNumber?.replace(/\d+/g, '') || '';
          const letterB = b.seatNumber?.replace(/\d+/g, '') || '';
          return letterA.localeCompare(letterB);
        }),
      ]);
  }, [seatsByRow]);

  const maxSeatsPerRow = Math.max(
    0,
    ...sortedRows.map(([, rowSeats]) => rowSeats.length),
  );
  const totalRows = sortedRows.length;

  const getSeatColor = (seat) => {
    const isSelectedByAnyPassenger = selectedSeats.some(s => s?.id === seat.id);
    const availability = getSeatAvailability(seat);

    if (isSelectedByAnyPassenger) {
      return 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/25 dark:border-cyan-400 dark:bg-cyan-500 dark:text-slate-950';
    }
    if (!availability.available) {
      return 'cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400 dark:border-white/10 dark:bg-slate-800 dark:text-slate-600';
    }
    if (hasExtraLegroom(seat)) {
      return 'border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/60 dark:bg-emerald-500/15 dark:text-emerald-100 dark:hover:bg-emerald-500/25';
    }
    if (seat.seatType === 'WINDOW') {
      return 'border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 dark:border-cyan-400/50 dark:bg-cyan-500/15 dark:text-cyan-100 dark:hover:bg-cyan-500/25';
    }
    return 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400/60 dark:hover:bg-cyan-500/15';
  };

  const getSeatPrice = (seat) => {
    const value =
      seat?.price ??
      seat?.fare ??
      seat?.seat?.totalPrice ??
      seat?.seat?.premiumSurcharge ??
      seat?.premiumSurcharge ??
      0;

    return Number.isFinite(Number(value)) ? Number(value) : 0;
  };

  const isSeatAvailable = (seat) => {
    return getSeatAvailability(seat).available;
  };

  const getSeatAvailability = (seat) => {
    const status = seat?.status?.toString().toUpperCase();
    const holdExpiresAt = seat?.holdExpiresAt ? new Date(seat.holdExpiresAt).getTime() : null;
    const holdExpired = holdExpiresAt && Number.isFinite(holdExpiresAt) && holdExpiresAt <= Date.now();

    if (status === 'AVAILABLE') {
      return { available: true, label: 'Available' };
    }

    if (status === 'HELD') {
      return holdExpired
        ? { available: true, label: 'Available' }
        : { available: false, label: 'Held' };
    }

    if (['BOOKED', 'OCCUPIED', 'BLOCKED', 'RESERVED', 'UNAVAILABLE'].includes(status)) {
      return { available: false, label: status === 'BOOKED' ? 'Booked' : 'Unavailable' };
    }

    if (seat?.isBooked || seat?.booked || seat?.isOccupied) {
      return { available: false, label: seat?.isBooked || seat?.booked ? 'Booked' : 'Unavailable' };
    }

    if (seat?.isAvailable === true) {
      return { available: true, label: 'Available' };
    }

    return { available: false, label: 'Unavailable' };
  };

  const hasExtraLegroom = (seat) => {
    const characteristics = seat?.seatCharacteristics?.toString().toUpperCase() || '';
    return Boolean(
      seat?.seat?.hasExtraLegroom ||
      seat?.seatType === 'EMERGENCY_EXIT' ||
      characteristics.includes('EXTRA_LEGROOM') ||
      characteristics.includes('EXTRA LEGROOM')
    );
  };

  const handleSeatClick = async (seat) => {
    const availability = getSeatAvailability(seat);
    const isAvailable = availability.available;
    const isAlreadySelected = selectedSeats.some(s => s?.id === seat.id);

    if (!isAvailable) {
      toast.error(`Seat ${seat?.seatNumber || ''} is ${availability.label.toLowerCase()}. Please choose another seat.`);
      return;
    }

    if (isAlreadySelected) {
      return;
    }

    if (isAvailable && !isAlreadySelected) {
      let previousSeatForPassenger = selectedSeats[currentPassengerIndex] || null;
      try {
        const nextSeat = {
          ...seat,
          price: getSeatPrice(seat),
        };
        const nextSelectedSeats = Array.from(
          { length: passengerCount },
          (_, index) => selectedSeats[index] || null,
        );
        previousSeatForPassenger = nextSelectedSeats[currentPassengerIndex];
        nextSelectedSeats[currentPassengerIndex] = nextSeat;

        const nextSeatIds = nextSelectedSeats.filter(Boolean).map((item) => item.id);
        const previousSeatIds = selectedSeats.filter(Boolean).map((item) => item.id);
        const removedSeatIds = previousSeatIds.filter((id) => !nextSeatIds.includes(id));

        const hold = await dispatch(
          holdSeatInstances({
            flightInstanceId,
            seatInstanceIds: [seat.id],
            userId: currentUser?.id,
            holdToken: seatHold?.holdToken,
            holdMinutes: 10,
          }),
        ).unwrap();

        onSeatHoldChange?.({
          holdToken: hold?.holdToken,
          holdExpiresAt: hold?.holdExpiresAt,
          seatInstanceIds: nextSeatIds,
        });

        if (removedSeatIds.length > 0 && seatHold?.holdToken) {
          await dispatch(
            releaseSeatInstances({
              seatInstanceIds: removedSeatIds,
              holdToken: seatHold.holdToken,
            }),
          ).unwrap();
        }

        onSelectSeat(currentPassengerIndex, nextSeat);

        if (currentPassengerIndex < passengerCount - 1) {
          setCurrentPassengerIndex(currentPassengerIndex + 1);
        } else {
          setShowSeatMap(false);
        }
      } catch (error) {
        toast.error(error || 'Seat is no longer available. Please choose another seat.');
        onSelectSeat(currentPassengerIndex, previousSeatForPassenger || null);
        if (flightInstanceId) dispatch(fetchSeatInstancesByFlightInstance(flightInstanceId));
      }
    }
  };

  const handleRemoveSeat = async (passengerIndex) => {
    const seatToRemove = selectedSeats[passengerIndex];
    if (!seatToRemove) return;

    try {
      if (seatHold?.holdToken) {
        await dispatch(
          releaseSeatInstances({
            seatInstanceIds: [seatToRemove.id],
            holdToken: seatHold.holdToken,
          }),
        ).unwrap();
      }

      const nextSelectedSeats = [...selectedSeats];
      nextSelectedSeats[passengerIndex] = null;
      const remainingSeatIds = nextSelectedSeats.filter(Boolean).map((seat) => seat.id);

      onSelectSeat(passengerIndex, null);
      onSeatHoldChange?.(
        remainingSeatIds.length > 0
          ? {
              ...seatHold,
              seatInstanceIds: remainingSeatIds,
            }
          : null,
      );
    } catch (error) {
      toast.error(error || 'Could not release this seat. Please try again.');
      if (flightInstanceId) dispatch(fetchSeatInstancesByFlightInstance(flightInstanceId));
    }
  };

  const openSeatMapForPassenger = (passengerIndex) => {
    setCurrentPassengerIndex(passengerIndex);
    setShowSeatMap(true);
  };

  if (loading || seatsLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-300"></div>
        </div>
      </div>
    );
  }

  if (!visibleSeats || visibleSeats.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/10">
            <Armchair className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Seat Selection</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Optional seat preference</p>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-white/10 dark:bg-slate-950/40">
          <Armchair className="mx-auto mb-3 h-12 w-12 text-slate-400 dark:text-slate-500" />
          <p className="text-base font-semibold text-slate-950 dark:text-white">
            Seat map is not available yet
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            {seatError ||
              'This flight instance does not have generated seat inventory yet. You can continue booking now; seats will be assigned during check-in or after airline inventory is published.'}
          </p>
          {flightInstanceId && (
            <button
              onClick={() => dispatch(fetchSeatInstancesByFlightInstance(flightInstanceId))}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reload seat map
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  const totalSelectedSeats = selectedSeats.filter(s => s !== null && s !== undefined).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/10">
            <Armchair className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Seat Selection</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {totalSelectedSeats} of {passengerCount} passengers selected
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs text-slate-500 dark:text-slate-400">Available Seats</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-300">
              {visibleSeats.filter(isSeatAvailable).length}
            </p>
          </div>
        </div>
      </div>

      {tripType === 'ROUND_TRIP' && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Seat selection applies to {routeLabel}
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-100/80">
                Return-flight seat selection is not available in this checkout yet. You can continue booking and select return seats later during check-in.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 space-y-3">
        {Array.from({ length: passengerCount }).map((_, index) => {
          const passengerSeat = selectedSeats[index];

          return (
            <div
              key={index}
              className={`rounded-lg border p-4 transition-colors ${
                passengerSeat
                  ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/30 dark:bg-emerald-500/10'
                  : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950/40'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-md ${
                    passengerSeat ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-slate-200 dark:bg-white/10'
                  }`}>
                    <User className={`h-5 w-5 ${passengerSeat ? 'text-emerald-700 dark:text-emerald-200' : 'text-slate-500 dark:text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      Passenger {index + 1}
                    </p>
                    {passengerSeat ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-emerald-700 dark:text-emerald-200">
                          Seat {passengerSeat.seatNumber}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                          {passengerSeat.seatType}
                        </span>
                        {hasExtraLegroom(passengerSeat) && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100">
                            Extra Legroom
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No seat selected</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {passengerSeat && (
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-200">
                      {currencyFormatter.format(getSeatPrice(passengerSeat))}
                    </span>
                  )}
                  {passengerSeat ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openSeatMapForPassenger(index)}
                        className="rounded-md bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25"
                      >
                        Change
                      </button>
                      <button
                        onClick={() => handleRemoveSeat(index)}
                        className="rounded-md p-1.5 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        aria-label={`Remove seat for passenger ${index + 1}`}
                      >
                        <X className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openSeatMapForPassenger(index)}
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Select Seat
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showSeatMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
            onClick={() => setShowSeatMap(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
            >
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-slate-950 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
                      <Armchair className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                        Select seat
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Passenger {currentPassengerIndex + 1} · {totalSelectedSeats} of {passengerCount} selected
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSeatMap(false)}
                    className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Close seat map"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {passengerCount > 1 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {Array.from({ length: passengerCount }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPassengerIndex(index)}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                          currentPassengerIndex === index
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-100'
                            : selectedSeats[index]
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/10'
                        }`}
                      >
                        <User className="h-4 w-4" />
                        Passenger {index + 1}
                        {selectedSeats[index] && (
                          <span className="rounded bg-white px-1.5 py-0.5 text-xs dark:bg-white/10">
                            {selectedSeats[index].seatNumber}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/70">
                    <div className="flex items-center gap-3">
                      <Plane className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      <div>
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">
                          {routeLabel} · {flightInstance?.flightName || flightInstance?.flightNumber || 'Aircraft layout'}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {totalRows} rows · up to {maxSeatsPerRow} seats per row · {visibleSeats.filter(isSeatAvailable).length} available
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/70">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Current passenger
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      Passenger {currentPassengerIndex + 1}
                    </p>
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/70">
                  {[
                    ['border-slate-300 bg-white dark:border-white/10 dark:bg-slate-900', 'Available'],
                    ['border-blue-600 bg-blue-600 dark:border-cyan-400 dark:bg-cyan-500', 'Selected'],
                    ['border-cyan-300 bg-cyan-50 dark:border-cyan-400/50 dark:bg-cyan-500/15', 'Window'],
                    ['border-emerald-400 bg-emerald-50 dark:border-emerald-400/60 dark:bg-emerald-500/15', 'Extra legroom'],
                    ['border-slate-200 bg-slate-200 dark:border-white/10 dark:bg-slate-800', 'Booked / unavailable'],
                  ].map(([boxClass, label]) => (
                    <div key={label} className="inline-flex items-center gap-2 rounded-md px-2 py-1">
                      <span className={`h-5 w-5 rounded border ${boxClass}`} />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/50">
                  <div className="mx-auto w-max min-w-full space-y-2">
                    <div className="mx-auto mb-5 h-8 max-w-md rounded-b-full border border-t-0 border-slate-300 bg-white text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
                      Front
                    </div>
                    {sortedRows.map(([row, sortedSeats]) => {
                    const splitIndex = Math.ceil(sortedSeats.length / 2);
                    const leftSeats = sortedSeats.slice(0, splitIndex);
                    const rightSeats = sortedSeats.slice(splitIndex);

                    return (
                      <div key={row} className="flex items-center justify-center gap-3">
                        <span className="w-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                          {row}
                        </span>

                        <div className="flex gap-1.5">
                          {leftSeats.map((seat) => {
                            const availability = getSeatAvailability(seat);
                            const isAvailable = availability.available;
                            const isSelectedByAnyPassenger = selectedSeats.some(s => s?.id === seat.id);
                            const canSelect = isAvailable && !isSelectedByAnyPassenger;

                            return (
                              <motion.button
                                key={seat.id}
                                whileHover={canSelect ? { scale: 1.1 } : {}}
                                whileTap={canSelect ? { scale: 0.95 } : {}}
                                onClick={() => handleSeatClick(seat)}
                                disabled={!canSelect || holdLoading}
                                className={`relative min-h-[56px] w-14 rounded-md border p-2 transition-all ${getSeatColor(seat)}`}
                                title={`${seat.seatNumber} · ${isAvailable ? currencyFormatter.format(getSeatPrice(seat)) : availability.label}`}
                              >
                                <div className="flex flex-col items-center">
                                  {isAvailable || isSelectedByAnyPassenger ? (
                                    <Armchair className="mb-0.5 h-4 w-4" />
                                  ) : (
                                    <Ban className="mb-0.5 h-4 w-4" />
                                  )}
                                  <span className="text-xs font-bold">
                                    {seat.seatNumber.replace(/\d+/g, '')}
                                  </span>
                                  {isAvailable && !isSelectedByAnyPassenger && (
                                    <span className="text-[10px] font-bold mt-0.5">
                                      {currencyFormatter.format(getSeatPrice(seat))}
                                    </span>
                                  )}
                                  {!isAvailable && (
                                    <span className="mt-0.5 text-[9px] font-bold uppercase">
                                      {availability.label}
                                    </span>
                                  )}
                                </div>
                                {hasExtraLegroom(seat) && (
                                  <div className="absolute -right-1 -top-1">
                                    <Sparkles className="h-3 w-3 text-emerald-500" />
                                  </div>
                                )}
                                {isSelectedByAnyPassenger && (
                                  <div className="absolute -right-1 -top-1 rounded-full bg-blue-600 p-0.5">
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>

                        <div className="flex h-12 w-10 items-center justify-center border-x border-dashed border-slate-300 dark:border-white/10">
                          <span className="rotate-90 text-[10px] font-semibold text-slate-400">
                            AISLE
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          {rightSeats.map((seat) => {
                            const availability = getSeatAvailability(seat);
                            const isAvailable = availability.available;
                            const isSelectedByAnyPassenger = selectedSeats.some(s => s?.id === seat.id);
                            const canSelect = isAvailable && !isSelectedByAnyPassenger;

                            return (
                              <motion.button
                                key={seat.id}
                                whileHover={canSelect ? { scale: 1.1 } : {}}
                                whileTap={canSelect ? { scale: 0.95 } : {}}
                                onClick={() => handleSeatClick(seat)}
                                disabled={!canSelect || holdLoading}
                                className={`relative min-h-[56px] w-14 rounded-md border p-2 transition-all ${getSeatColor(seat)}`}
                                title={`${seat.seatNumber} · ${isAvailable ? currencyFormatter.format(getSeatPrice(seat)) : availability.label}`}
                              >
                                <div className="flex flex-col items-center">
                                  {isAvailable || isSelectedByAnyPassenger ? (
                                    <Armchair className="mb-0.5 h-4 w-4" />
                                  ) : (
                                    <Ban className="mb-0.5 h-4 w-4" />
                                  )}
                                  <span className="text-xs font-bold">
                                    {seat.seatNumber.replace(/\d+/g, '')}
                                  </span>
                                  {isAvailable && !isSelectedByAnyPassenger && (
                                    <span className="text-[10px] font-bold mt-0.5">
                                      {currencyFormatter.format(getSeatPrice(seat))}
                                    </span>
                                  )}
                                  {!isAvailable && (
                                    <span className="mt-0.5 text-[9px] font-bold uppercase">
                                      {availability.label}
                                    </span>
                                  )}
                                </div>
                                {hasExtraLegroom(seat) && (
                                  <div className="absolute -right-1 -top-1">
                                    <Sparkles className="h-3 w-3 text-emerald-500" />
                                  </div>
                                )}
                                {isSelectedByAnyPassenger && (
                                  <div className="absolute -right-1 -top-1 rounded-full bg-blue-600 p-0.5">
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>

                        <span className="w-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                          {row}
                        </span>
                      </div>
                    );
                    })}
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-400/20 dark:bg-blue-500/10">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                    <p className="text-xs leading-5 text-blue-900 dark:text-blue-100">
                      Selected seats are held for 10 minutes while you finish checkout.
                    </p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Seat selection
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                    {totalSelectedSeats} of {passengerCount} selected
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {totalSelectedSeats < passengerCount && (
                    <button
                      onClick={() => setShowSeatMap(false)}
                      className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      Skip for now
                    </button>
                  )}
                  {currentPassengerIndex < passengerCount - 1 ? (
                  <button
                    onClick={() => setCurrentPassengerIndex(currentPassengerIndex + 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Next passenger
                  </button>
                  ) : (
                    <button
                      onClick={() => setShowSeatMap(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Confirm seats
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SeatSelection;
