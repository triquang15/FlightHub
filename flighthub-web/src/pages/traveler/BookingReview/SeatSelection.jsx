import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, X, Check, Sparkles, ChevronRight, Info, Plane, User, RefreshCw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  fetchSeatInstancesByFlightInstance,
  holdSeatInstances,
  releaseSeatInstances,
} from '@/Redux/seat/seatThunk';

const SeatSelection = ({
  selectedSeats = [],
  onSelectSeat,
  passengerCount = 1,
  flightInstanceId,
}) => {
  const dispatch = useDispatch();
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  const [seatHoldByPassenger, setSeatHoldByPassenger] = useState({});

  const { flightInstance, loading } = useSelector((state) => state.flightInstance);
  const {
    seats = [],
    loading: seatsLoading,
    holdLoading,
    error: seatError,
  } = useSelector((state) => state.seat || {});

  useEffect(() => {
    if (flightInstanceId) {
      dispatch(fetchSeatInstancesByFlightInstance(flightInstanceId));
    }
  }, [dispatch, flightInstanceId]);

  const seatsByRow = useMemo(() => {
    return seats.reduce((acc, seat) => {
      const rowNumber = parseInt(seat.seatNumber?.match(/\d+/)?.[0] || '0', 10);
      if (!acc[rowNumber]) acc[rowNumber] = [];
      acc[rowNumber].push(seat);
      return acc;
    }, {});
  }, [seats]);

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

    if (!isSeatAvailable(seat)) {
      return 'bg-gray-300 cursor-not-allowed text-gray-500';
    }
    if (isSelectedByAnyPassenger) {
      return 'bg-blue-600 text-white border-blue-600';
    }
    if (seat.seatCharacteristics?.includes('EXTRA_LEGROOM') || seat.seatType === 'EMERGENCY_EXIT') {
      return 'bg-green-100 hover:bg-green-200 border-green-400 text-green-800';
    }
    if (seat.seatType === 'WINDOW') {
      return 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800';
    }
    return 'bg-gray-50 hover:bg-blue-50 border-gray-300 text-gray-700';
  };

  const getSeatPrice = (seat) => {
    if (typeof seat.price === 'number') return seat.price;
    if (typeof seat.fare === 'number') return seat.fare;
    if (seat.seatCharacteristics?.includes('EXTRA_LEGROOM') || seat.seatType === 'EMERGENCY_EXIT') {
      return 800;
    }
    if (seat.seatType === 'WINDOW' || seat.seatType === 'AISLE') {
      return 300;
    }
    return 150; // Middle seat
  };

  const isSeatAvailable = (seat) => {
    return seat.status === 'AVAILABLE'
      || (seat.isAvailable && !seat.isOccupied && !seat.isBooked && !seat.booked);
  };

  const handleSeatClick = async (seat) => {
    const isAvailable = isSeatAvailable(seat);
    const isAlreadySelected = selectedSeats.some(s => s?.id === seat.id);

    if (isAvailable && !isAlreadySelected) {
      try {
        const previousHold = seatHoldByPassenger[currentPassengerIndex];
        if (previousHold?.seatInstanceId) {
          await dispatch(releaseSeatInstances({
            seatInstanceIds: [previousHold.seatInstanceId],
            holdToken: previousHold.holdToken,
          })).unwrap();
        }

        const hold = await dispatch(holdSeatInstances({
          flightInstanceId: Number(flightInstanceId),
          seatInstanceIds: [seat.id],
          holdMinutes: 10,
        })).unwrap();

        const heldSeat = hold?.seats?.[0] || seat;
        setSeatHoldByPassenger((current) => ({
          ...current,
          [currentPassengerIndex]: {
            seatInstanceId: heldSeat.id,
            holdToken: hold?.holdToken,
            holdExpiresAt: hold?.holdExpiresAt,
          },
        }));

        onSelectSeat(currentPassengerIndex, {
          ...heldSeat,
          price: getSeatPrice(heldSeat),
          holdToken: hold?.holdToken,
          holdExpiresAt: hold?.holdExpiresAt,
        });

        if (currentPassengerIndex < passengerCount - 1) {
          setCurrentPassengerIndex(currentPassengerIndex + 1);
        } else {
          setShowSeatMap(false);
        }
      } catch (error) {
        toast.error(error || 'Seat is no longer available. Please choose another seat.');
        if (flightInstanceId) dispatch(fetchSeatInstancesByFlightInstance(flightInstanceId));
      }
    }
  };

  const handleRemoveSeat = async (passengerIndex) => {
    const hold = seatHoldByPassenger[passengerIndex];
    if (hold?.seatInstanceId) {
      try {
        await dispatch(releaseSeatInstances({
          seatInstanceIds: [hold.seatInstanceId],
          holdToken: hold.holdToken,
        })).unwrap();
      } catch (error) {
        toast.error(error || 'Unable to release the selected seat');
      }
    }

    setSeatHoldByPassenger((current) => {
      const next = { ...current };
      delete next[passengerIndex];
      return next;
    });
    onSelectSeat(passengerIndex, null);
  };

  const openSeatMapForPassenger = (passengerIndex) => {
    setCurrentPassengerIndex(passengerIndex);
    setShowSeatMap(true);
  };

  if (loading || seatsLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!seats || seats.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Armchair className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Seat Selection</h2>
          <p className="text-sm text-gray-600">Choose your preferred seats</p>
          </div>
        </div>
        <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl text-center">
          <Armchair className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            {seatError || 'No seats available for this flight yet'}
          </p>
          {flightInstanceId && (
            <button
              onClick={() => dispatch(fetchSeatInstancesByFlightInstance(flightInstanceId))}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reload seats
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
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Armchair className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Seat Selection</h2>
            <p className="text-sm text-gray-600">
              {totalSelectedSeats} of {passengerCount} passengers selected
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">Available Seats</p>
            <p className="text-lg font-bold text-indigo-600">
              {seats.filter(isSeatAvailable).length}
            </p>
          </div>
        </div>
      </div>

      {/* Passenger Seat Cards */}
      <div className="space-y-3 mb-4">
        {Array.from({ length: passengerCount }).map((_, index) => {
          const passengerSeat = selectedSeats[index];

          return (
            <div
              key={index}
              className={`p-4 border-2 rounded-xl transition-all ${
                passengerSeat
                  ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    passengerSeat ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    <User className={`w-5 h-5 ${passengerSeat ? 'text-green-600' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Passenger {index + 1}
                    </p>
                    {passengerSeat ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-green-600">
                          Seat {passengerSeat.seatNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-700 border border-gray-200">
                          {passengerSeat.seatType}
                        </span>
                        {(passengerSeat.seatCharacteristics?.includes('EXTRA_LEGROOM') ||
                          passengerSeat.seatType === 'EMERGENCY_EXIT') && (
                          <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full font-medium">
                            Extra Legroom
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">No seat selected</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {passengerSeat && (
                    <span className="text-base font-bold text-green-600">
                      ₹{getSeatPrice(passengerSeat)}
                    </span>
                  )}
                  {passengerSeat ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openSeatMapForPassenger(index)}
                        className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                      >
                        Change
                      </button>
                      <button
                        onClick={() => handleRemoveSeat(index)}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openSeatMapForPassenger(index)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Select Seat
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seat Map Modal */}
      <AnimatePresence>
        {showSeatMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSeatMap(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Select Seat for Passenger {currentPassengerIndex + 1}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {totalSelectedSeats} of {passengerCount} seats selected
                  </p>
                </div>
                <button
                  onClick={() => setShowSeatMap(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Passenger Navigation */}
              {passengerCount > 1 && (
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                  {Array.from({ length: passengerCount }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPassengerIndex(index)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap ${
                        currentPassengerIndex === index
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : selectedSeats[index]
                          ? 'border-green-200 bg-green-50 text-green-600'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Passenger {index + 1}
                      </span>
                      {selectedSeats[index] && (
                        <span className="text-xs font-bold">
                          {selectedSeats[index].seatNumber}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Flight Info Banner */}
              <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-3">
                  <Plane className="w-5 h-5 text-indigo-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {flightInstance?.flightName || flightInstance?.flightNumber || 'Aircraft Layout'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {totalRows} Rows • up to {maxSeatsPerRow} seats per row • {seats.length} Total Seats
                    </p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-gray-300 bg-gray-50 rounded"></div>
                  <span className="text-xs text-gray-700 font-medium">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <span className="text-xs text-gray-700 font-medium">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded"></div>
                  <span className="text-xs text-gray-700 font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-purple-300 bg-purple-50 rounded"></div>
                  <span className="text-xs text-gray-700 font-medium">Window</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-green-400 bg-green-100 rounded"></div>
                  <span className="text-xs text-gray-700 font-medium">Extra Legroom</span>
                </div>
              </div>

              {/* Seat Map */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto px-2">
                {sortedRows
                  .map(([row, sortedSeats]) => {
                    const splitIndex = Math.ceil(sortedSeats.length / 2);
                    const leftSeats = sortedSeats.slice(0, splitIndex);
                    const rightSeats = sortedSeats.slice(splitIndex);

                    return (
                      <div key={row} className="flex items-center gap-3">
                        {/* Row Number */}
                        <span className="text-sm font-bold text-gray-700 w-8 text-center">
                          {row}
                        </span>

                        {/* Left Section */}
                        <div className="flex gap-1">
                          {leftSeats.map((seat) => {
                            const isAvailable = isSeatAvailable(seat);
                            const isSelectedByAnyPassenger = selectedSeats.some(s => s?.id === seat.id);
                            const canSelect = isAvailable && !isSelectedByAnyPassenger;

                            return (
                              <motion.button
                                key={seat.id}
                                whileHover={canSelect ? { scale: 1.1 } : {}}
                                whileTap={canSelect ? { scale: 0.95 } : {}}
                                onClick={() => handleSeatClick(seat)}
                                disabled={!canSelect || holdLoading}
                                className={`relative p-2 rounded-lg border-2 transition-all min-w-[60px] ${getSeatColor(seat)}`}
                              >
                                <div className="flex flex-col items-center">
                                  <Armchair className="w-4 h-4 mb-0.5" />
                                  <span className="text-xs font-bold">
                                    {seat.seatNumber.replace(/\d+/g, '')}
                                  </span>
                                  {isAvailable && !isSelectedByAnyPassenger && (
                                    <span className="text-[10px] font-bold mt-0.5">
                                      ₹{getSeatPrice(seat)}
                                    </span>
                                  )}
                                </div>
                                {(seat.seatCharacteristics?.includes('EXTRA_LEGROOM') ||
                                  seat.seatType === 'EMERGENCY_EXIT') && (
                                  <div className="absolute -top-1 -right-1">
                                    <Sparkles className="w-3 h-3 text-green-600" />
                                  </div>
                                )}
                                {isSelectedByAnyPassenger && (
                                  <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-0.5">
                                    <Check className="w-2.5 h-2.5 text-white" />
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>

                        {/* Aisle */}
                        <div className="w-8 border-l-2 border-r-2 border-dashed border-gray-300 h-12 flex items-center justify-center">
                          <span className="text-[10px] text-gray-400 font-medium rotate-90">
                            AISLE
                          </span>
                        </div>

                        {/* Right Section */}
                        <div className="flex gap-1">
                          {rightSeats.map((seat) => {
                            const isAvailable = isSeatAvailable(seat);
                            const isSelectedByAnyPassenger = selectedSeats.some(s => s?.id === seat.id);
                            const canSelect = isAvailable && !isSelectedByAnyPassenger;

                            return (
                              <motion.button
                                key={seat.id}
                                whileHover={canSelect ? { scale: 1.1 } : {}}
                                whileTap={canSelect ? { scale: 0.95 } : {}}
                                onClick={() => handleSeatClick(seat)}
                                disabled={!canSelect || holdLoading}
                                className={`relative p-2 rounded-lg border-2 transition-all min-w-[60px] ${getSeatColor(seat)}`}
                              >
                                <div className="flex flex-col items-center">
                                  <Armchair className="w-4 h-4 mb-0.5" />
                                  <span className="text-xs font-bold">
                                    {seat.seatNumber.replace(/\d+/g, '')}
                                  </span>
                                  {isAvailable && !isSelectedByAnyPassenger && (
                                    <span className="text-[10px] font-bold mt-0.5">
                                      ₹{getSeatPrice(seat)}
                                    </span>
                                  )}
                                </div>
                                {(seat.seatCharacteristics?.includes('EXTRA_LEGROOM') ||
                                  seat.seatType === 'EMERGENCY_EXIT') && (
                                  <div className="absolute -top-1 -right-1">
                                    <Sparkles className="w-3 h-3 text-green-600" />
                                  </div>
                                )}
                                {isSelectedByAnyPassenger && (
                                  <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-0.5">
                                    <Check className="w-2.5 h-2.5 text-white" />
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>

                        {/* Row Number (Right) */}
                        <span className="text-sm font-bold text-gray-700 w-8 text-center">
                          {row}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Additional Info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800">
                    <span className="font-semibold">Tip:</span> Window seats offer great views,
                    while aisle seats provide easy access. Emergency exit rows have extra legroom
                    but come with additional responsibilities. Seats with blue checkmarks are already selected by other passengers.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowSeatMap(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {totalSelectedSeats === passengerCount ? 'Done' : 'Close'}
                </button>
                {currentPassengerIndex < passengerCount - 1 && (
                  <button
                    onClick={() => setCurrentPassengerIndex(currentPassengerIndex + 1)}
                    className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Next Passenger →
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SeatSelection;
