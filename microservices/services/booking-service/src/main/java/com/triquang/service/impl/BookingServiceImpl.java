package com.triquang.service.impl;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.AirlineClient;
import com.triquang.client.AncillaryClient;
import com.triquang.client.FlightClient;
import com.triquang.client.PaymentClient;
import com.triquang.client.PricingClient;
import com.triquang.client.SeatClient;
import com.triquang.enums.BookingStatus;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.PaymentGateway;
import com.triquang.exception.BaseException;
import com.triquang.mapper.BookingMapper;
import com.triquang.model.Booking;
import com.triquang.model.Passenger;
import com.triquang.payload.PaymentDTO;
import com.triquang.payload.request.BookingRequest;
import com.triquang.payload.request.PassengerRequest;
import com.triquang.payload.request.PaymentInitiateRequest;
import com.triquang.payload.request.SeatHoldRequest;
import com.triquang.payload.request.SeatReleaseRequest;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.BookingResponse;
import com.triquang.payload.response.BookingStatisticsResponse;
import com.triquang.payload.response.FareResponse;
import com.triquang.payload.response.FlightCabinAncillaryResponse;
import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.payload.response.FlightMealResponse;
import com.triquang.payload.response.FlightResponse;
import com.triquang.payload.response.PaymentInitiateResponse;
import com.triquang.payload.response.SeatHoldResponse;
import com.triquang.payload.response.SeatInstanceResponse;
import com.triquang.repository.BookingRepository;
import com.triquang.repository.BookingPeriodStatistics;
import com.triquang.service.BookingService;
import com.triquang.service.PassengerService;
import com.triquang.service.PricingIntegrationService;
import com.triquang.service.TicketService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    @Value("${booking.currency:USD}")
    private String bookingCurrency = "USD";

    private final BookingRepository bookingRepository;
    private final PassengerService passengerService;
    private final TicketService ticketService;
    private final PricingIntegrationService pricingIntegrationService;
    private final PricingClient pricingClient;
    private final AncillaryClient ancillaryClient;
    private final PaymentClient paymentClient;
    private final SeatClient seatClient;
    private final FlightClient flightClient;
    private final AirlineClient airlineClient;

    @Override
    public PaymentInitiateResponse createBooking(BookingRequest request, Long userId) {

        log.info("Creating booking for user: {}", userId);

        String currency = normalizeBookingCurrency();
        String bookingReference = generateBookingReference();

        Set<Passenger> passengers = new HashSet<>();
        for (PassengerRequest passengerRequest : request.getPassengers()) {
            Passenger passenger = passengerService
                    .findOrCreatePassengerEntity(passengerRequest, userId);
            passengers.add(passenger);
        }

        FlightResponse flightResponse;
        try {
            flightResponse = flightClient.getFlightById(request.getFlightId());
        } catch (Exception e) {
            log.error("Booking {} failed while fetching flightId={} for userId={}",
                    bookingReference, request.getFlightId(), userId, e);
            throw new BaseException(ErrorCode.FLIGHT_NOT_FOUND);
        }

        Booking booking = BookingMapper.toEntity(
                request, userId, passengers, bookingReference);
        booking.setStatus(BookingStatus.PENDING);
        booking.setAirlineId(flightResponse.getAirline().getId());
        booking.setCurrency(currency);
        booking.setTotalAmount(BigDecimal.ZERO);

        List<Long> seatInstanceIds = extractSeatInstanceIds(request);
        booking.setSeatInstanceIds(seatInstanceIds);

        booking = bookingRepository.saveAndFlush(booking);

        for (Passenger passenger : passengers) {
            passenger.setBooking(booking);
        }

        int passengerCount = booking.getPassengers().size();
        SeatHoldResponse seatHold = null;

        BigDecimal fareTotal;
        BigDecimal seatPrice;
        BigDecimal ancillaryPrice;
        BigDecimal mealPrice;

        try {
            FareResponse fare = pricingClient.getFareById(booking.getFareId());
            if (fare.getCurrency() == null
                    || !currency.equalsIgnoreCase(fare.getCurrency())) {
                throw new BaseException(ErrorCode.INVALID_INPUT);
            }
            if (hasItems(booking.getSeatInstanceIds())) {
                seatHold = seatClient.holdSeats(SeatHoldRequest.builder()
                        .flightInstanceId(booking.getFlightInstanceId())
                        .seatInstanceIds(booking.getSeatInstanceIds())
                        .userId(userId)
                        .holdMinutes(15)
                        .build());
                booking.setSeatHoldToken(seatHold.getHoldToken());
                booking.setSeatHoldExpiresAt(seatHold.getHoldExpiresAt());
            }

            fareTotal = money(pricingIntegrationService.calculateFareTotal(booking.getFareId()))
                    .multiply(BigDecimal.valueOf(passengerCount));
            seatPrice = hasItems(booking.getSeatInstanceIds())
                    ? money(seatClient.calculateSeatPrice(booking.getSeatInstanceIds()))
                    : BigDecimal.ZERO;
            ancillaryPrice = hasItems(booking.getAncillaryIds())
                    ? money(ancillaryClient.calculateAncillariesPrice(booking.getAncillaryIds()))
                    : BigDecimal.ZERO;
            mealPrice = hasItems(booking.getMealIds())
                    ? money(ancillaryClient.calculateMealPrice(booking.getMealIds()))
                    : BigDecimal.ZERO;
        } catch (Exception e) {
            log.error(
                    "Booking {} failed during pricing/seat/ancillary calculation. fareId={}, flightInstanceId={}, seatIds={}, ancillaryIds={}, mealIds={}, configuredCurrency={}",
                    booking.getBookingReference(),
                    booking.getFareId(),
                    booking.getFlightInstanceId(),
                    booking.getSeatInstanceIds(),
                    booking.getAncillaryIds(),
                    booking.getMealIds(),
                    currency,
                    e);
            cancelPendingBooking(booking, userId, false);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }

        BigDecimal totalPrice = fareTotal.add(seatPrice).add(ancillaryPrice).add(mealPrice)
                .setScale(2, RoundingMode.HALF_UP);
        booking.setTotalAmount(totalPrice);
        booking.setCurrency(currency);
        booking = bookingRepository.saveAndFlush(booking);

        PaymentInitiateRequest paymentRequest = PaymentInitiateRequest.builder()
                .userId(userId)
                .bookingId(booking.getId())
                .amount(totalPrice)
                .currency(booking.getCurrency())
                .gateway(request.getPaymentGateway())
                .description("Booking: " + bookingReference)
                .build();

        PaymentInitiateResponse paymentInit;
        try {
            paymentInit = paymentClient.initiatePayment(paymentRequest, userId);
        } catch (Exception e) {
            log.error(
                    "Booking {} failed during payment initiation. bookingId={}, gateway={}, amount={}, currency={}",
                    booking.getBookingReference(),
                    booking.getId(),
                    request.getPaymentGateway(),
                    totalPrice,
                    booking.getCurrency(),
                    e);
            cancelPendingBooking(booking, userId, true);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }

        if (paymentInit == null) {
            cancelPendingBooking(booking, userId, true);
            throw new BaseException(ErrorCode.AIRLINE_SERVICE_UNAVAILABLE);
        }

        return paymentInit;
    }

    private String normalizeBookingCurrency() {
        if (bookingCurrency == null || bookingCurrency.isBlank()) {
            return "USD";
        }
        return bookingCurrency.trim().toUpperCase();
    }

    private BigDecimal money(Double value) {
        if (value == null || !Double.isFinite(value)) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private void cancelPendingBooking(Booking booking, Long userId, boolean cancelPayment) {
        if (cancelPayment && booking.getId() != null) {
            try {
                paymentClient.cancelPayment(booking.getId(), userId);
            } catch (Exception cleanupError) {
                log.warn("Could not cancel payment for failed booking {}: {}",
                        booking.getBookingReference(), cleanupError.getMessage());
            }
        }
        releaseSeatsQuietly(booking);
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.saveAndFlush(booking);
    }

    @Override
    @Transactional
    public BookingResponse updateBooking(Long id, BookingRequest request, Long userId) {

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.BOOKING_NOT_FOUND));
        requireBookingAccess(booking, userId);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        List<Long> requestedSeatIds = extractSeatInstanceIds(request);
        ensureCommercialTermsUnchanged(booking, request, requestedSeatIds);

        Set<Passenger> passengers = new HashSet<>();
        for (PassengerRequest passengerRequest : request.getPassengers()) {
            Passenger passenger = passengerService.findOrCreatePassengerEntity(
                    passengerRequest, booking.getUserId());
            passengers.add(passenger);
        }

        BookingMapper.updateEntityFromRequest(request, booking, passengers);
        Booking updated = bookingRepository.save(booking);
        return convertBookingResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id, Long userId) {
        Booking booking = bookingRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new BaseException(ErrorCode.BOOKING_NOT_FOUND));
        requireBookingAccess(booking, userId);
        return convertBookingResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByAirline(
            Long userId,
            String searchQuery,
            BookingStatus status,
            Long flightInstanceId,
            String sortDirection
    ) {

        AirlineResponse airlineResponse;
        try {
            airlineResponse = airlineClient.getAirlineByOwner(userId);
        } catch (Exception e) {
            throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
        }

        Long airlineId = airlineResponse.getId();

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, "bookingDate");

        List<Booking> bookings = bookingRepository.findByAirlineWithFilters(
                airlineId, searchQuery, status, flightInstanceId, sort);

        return enrichBatch(bookings);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::convertBookingResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long id, Long userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.BOOKING_NOT_FOUND));
        requireBookingAccess(booking, userId);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return convertBookingResponse(booking);
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        paymentClient.cancelPayment(booking.getId(), userId);

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setLastModified(LocalDateTime.now());
        Booking updated = bookingRepository.save(booking);
        releaseSeatsQuietly(updated);

        log.info("Booking cancelled: {}", booking.getBookingReference());
        return convertBookingResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBooking(Long id, Long userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.BOOKING_NOT_FOUND));
        requireBookingAccess(booking, userId);
        if (booking.getStatus() != BookingStatus.CANCELLED) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        bookingRepository.delete(booking);
        log.info("Booking deleted: {}", booking.getBookingReference());
    }

    @Override
    public boolean existsById(Long id) {
        return bookingRepository.existsById(id);
    }

    @Override
    public long count() {
        return bookingRepository.count();
    }

    @Override
    public long countByFlightId(Long flightId) {
        if (flightId == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        return bookingRepository.countByFlightInstanceId(flightId);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingStatisticsResponse getBookingStatisticsForAirline(Long userId) {

        if (userId == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        AirlineResponse airline = airlineClient.getAirlineByOwner(userId);
        if (airline == null || airline.getId() == null) {
            throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
        }

        Long airlineId = airline.getId();
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime nextMonthStart = today.plusMonths(1).withDayOfMonth(1).atStartOfDay();

        Long todayBookings = bookingRepository
                .countByAirlineIdAndStatusAndBookingDateGreaterThanEqualAndBookingDateLessThan(
                        airlineId, BookingStatus.CONFIRMED, todayStart, tomorrowStart);
        BigDecimal todayRevenue = bookingRepository.sumRevenueByAirlineAndPeriod(
                airlineId, BookingStatus.CONFIRMED, todayStart, tomorrowStart);
        Long monthBookings = bookingRepository
                .countByAirlineIdAndStatusAndBookingDateGreaterThanEqualAndBookingDateLessThan(
                        airlineId, BookingStatus.CONFIRMED, monthStart, nextMonthStart);
        BigDecimal monthRevenue = bookingRepository.sumRevenueByAirlineAndPeriod(
                airlineId, BookingStatus.CONFIRMED, monthStart, nextMonthStart);

        List<BookingStatisticsResponse.DailyBookingData> dailyTrend = bookingRepository
                .findDailyStatistics(airlineId, today.minusDays(29).atStartOfDay()).stream()
                .map(this::toDailyStatistics)
                .toList();
        List<BookingStatisticsResponse.MonthlyData> monthlyData = bookingRepository
                .findMonthlyStatistics(airlineId,
                        today.minusMonths(11).withDayOfMonth(1).atStartOfDay()).stream()
                .map(this::toMonthlyStatistics)
                .toList();

        return BookingStatisticsResponse.builder()
                .totalBookingsToday(todayBookings)
                .revenueToday(todayRevenue)
                .totalBookingsThisMonth(monthBookings)
                .revenueThisMonth(monthRevenue)
                .dailyTrend(dailyTrend)
                .monthlyData(monthlyData)
                .build();
    }

    private BookingStatisticsResponse.DailyBookingData toDailyStatistics(BookingPeriodStatistics row) {
        return BookingStatisticsResponse.DailyBookingData.builder()
                .date(row.getPeriod())
                .bookingCount(row.getBookingCount())
                .revenue(row.getRevenue())
                .build();
    }

    private BookingStatisticsResponse.MonthlyData toMonthlyStatistics(BookingPeriodStatistics row) {
        return BookingStatisticsResponse.MonthlyData.builder()
                .month(row.getPeriod())
                .bookingCount(row.getBookingCount())
                .revenue(row.getRevenue())
                .build();
    }

    private String generateBookingReference() {
        String reference;
        do {
            reference = "BK" + UUID.randomUUID().toString()
                    .substring(0, 8).toUpperCase();
        } while (bookingRepository.findByBookingReference(reference).isPresent());
        return reference;
    }

    private List<Long> extractSeatInstanceIds(BookingRequest request) {
        if (request.getPassengers() == null || request.getPassengers().isEmpty()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        List<Long> seatInstanceIds = request.getPassengers().stream()
                .map(PassengerRequest::getSeatInstanceId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (seatInstanceIds.stream().distinct().count() != seatInstanceIds.size()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        return seatInstanceIds;
    }

    private boolean hasItems(List<Long> ids) {
        return ids != null && !ids.isEmpty();
    }

    private void ensureCommercialTermsUnchanged(
            Booking booking, BookingRequest request, List<Long> requestedSeatIds) {
        boolean unchanged = Objects.equals(booking.getFlightId(), request.getFlightId())
                && Objects.equals(booking.getFlightInstanceId(), request.getFlightInstanceId())
                && Objects.equals(booking.getFareId(), request.getFareId())
                && booking.getCabinClass() == request.getCabinClass()
                && booking.getTripType() == request.getTripType()
                && Objects.equals(booking.getSeatInstanceIds(), requestedSeatIds)
                && Objects.equals(booking.getAncillaryIds(), request.getAncillaryIds())
                && Objects.equals(booking.getMealIds(), request.getMealIds())
                && booking.getPassengers().size() == request.getPassengers().size();

        if (!unchanged) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private void requireBookingAccess(Booking booking, Long userId) {
        if (userId == null) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }

        if (Objects.equals(booking.getUserId(), userId)) {
            return;
        }

        try {
            AirlineResponse airline = airlineClient.getAirlineByOwner(userId);
            if (airline != null && Objects.equals(booking.getAirlineId(), airline.getId())) {
                return;
            }
        } catch (Exception ignored) {
            // Fall through to forbidden.
        }

        throw new BaseException(ErrorCode.FORBIDDEN);
    }

    private void releaseSeatsQuietly(Booking booking) {
        if (booking == null || !hasItems(booking.getSeatInstanceIds())) {
            return;
        }

        try {
            seatClient.releaseSeats(SeatReleaseRequest.builder()
                    .seatInstanceIds(booking.getSeatInstanceIds())
                    .holdToken(booking.getSeatHoldToken())
                    .bookingReference(booking.getBookingReference())
                    .build());
        } catch (Exception e) {
            log.warn("Could not release seats for booking {}: {}", booking.getBookingReference(), e.getMessage());
        }
    }

    private BookingResponse convertBookingResponse(Booking booking) {
        List<FlightCabinAncillaryResponse> ancillaryResponses = hasItems(booking.getAncillaryIds())
                ? safeExternal("ancillaries", booking, () -> ancillaryClient.getAllByIds(booking.getAncillaryIds()), Collections.emptyList())
                : Collections.emptyList();

        List<FlightMealResponse> mealResponses = hasItems(booking.getMealIds())
                ? safeExternal("meals", booking, () -> ancillaryClient.getMealsByIds(booking.getMealIds()), Collections.emptyList())
                : Collections.emptyList();

        PaymentDTO paymentDTO =
                safeExternal("payment", booking, () -> paymentClient.getPaymentByBookingId(booking.getId()), null);

        FareResponse fareResponse =
                safeExternal("fare", booking, () -> pricingClient.getFareById(booking.getFareId()), null);

        FlightResponse flightResponse =
                safeExternal("flight", booking, () -> flightClient.getFlightById(booking.getFlightId()), null);

        List<SeatInstanceResponse> seatInstanceResponses = hasItems(booking.getSeatInstanceIds())
                ? safeExternal("seats", booking, () -> seatClient.getAllByIds(booking.getSeatInstanceIds()), Collections.emptyList())
                : Collections.emptyList();

        FlightInstanceResponse flightInstanceResponse =
                safeExternal("flight-instance", booking, () -> flightClient.getFlightInstanceResponse(booking.getFlightInstanceId()), null);

        return BookingMapper.toResponse(
                booking,
                paymentDTO,
                fareResponse,
                flightResponse,
                flightInstanceResponse,
                ancillaryResponses,
                mealResponses,
                seatInstanceResponses
        );
    }

    private <T> T safeExternal(String dependency, Booking booking, Supplier<T> supplier, T fallback) {
        try {
            return supplier.get();
        } catch (Exception e) {
            log.warn("Booking {} response missing {} enrichment: {}",
                    booking != null ? booking.getBookingReference() : "unknown",
                    dependency,
                    e.getMessage());
            return fallback;
        }
    }
    
    private List<BookingResponse> enrichBatch(List<Booking> bookings) {
        if (bookings.isEmpty()) return Collections.emptyList();

        List<Long> bookingIds = bookings.stream().map(Booking::getId).collect(Collectors.toList());

        List<Long> fareIds = bookings.stream().map(Booking::getFareId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        List<Long> flightIds = bookings.stream().map(Booking::getFlightId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        List<Long> flightInstanceIds = bookings.stream().map(Booking::getFlightInstanceId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        List<Long> allSeatIds = bookings.stream()
                .flatMap(b -> b.getSeatInstanceIds() != null ? b.getSeatInstanceIds().stream() : Stream.empty())
                .distinct().collect(Collectors.toList());
        List<Long> allAncillaryIds = bookings.stream()
                .flatMap(b -> b.getAncillaryIds() != null ? b.getAncillaryIds().stream() : Stream.empty())
                .distinct().collect(Collectors.toList());
        List<Long> allMealIds = bookings.stream()
                .flatMap(b -> b.getMealIds() != null ? b.getMealIds().stream() : Stream.empty())
                .distinct().collect(Collectors.toList());

        // One call per service
        Map<Long, FareResponse> fareMap = pricingClient.getFaresByIds(fareIds);
        Map<Long, FlightResponse> flightMap = flightClient.getFlightsByIds(flightIds);
        Map<Long, FlightInstanceResponse> flightInstanceMap = flightClient.getFlightInstancesByIds(flightInstanceIds);
        Map<Long, PaymentDTO> paymentMap = paymentClient.getPaymentsByBookingIds(bookingIds);

        Map<Long, SeatInstanceResponse> seatMap = allSeatIds.isEmpty()
                ? Collections.emptyMap()
                : seatClient.getAllByIds(allSeatIds).stream()
                        .collect(Collectors.toMap(SeatInstanceResponse::getId, s -> s));
        Map<Long, FlightCabinAncillaryResponse> ancillaryMap = allAncillaryIds.isEmpty()
                ? Collections.emptyMap()
                : ancillaryClient.getAllByIds(allAncillaryIds).stream()
                        .collect(Collectors.toMap(FlightCabinAncillaryResponse::getId, a -> a));
        Map<Long, FlightMealResponse> mealMap = allMealIds.isEmpty()
                ? Collections.emptyMap()
                : ancillaryClient.getMealsByIds(allMealIds).stream()
                        .collect(Collectors.toMap(FlightMealResponse::getId, m -> m));

        return bookings.stream().map(booking -> {
            List<SeatInstanceResponse> seats = booking.getSeatInstanceIds() != null
                    ? booking.getSeatInstanceIds().stream()
                            .map(seatMap::get).filter(Objects::nonNull).collect(Collectors.toList())
                    : Collections.emptyList();
            List<FlightCabinAncillaryResponse> ancillaries = booking.getAncillaryIds() != null
                    ? booking.getAncillaryIds().stream()
                            .map(ancillaryMap::get).filter(Objects::nonNull).collect(Collectors.toList())
                    : Collections.emptyList();
            List<FlightMealResponse> meals = booking.getMealIds() != null
                    ? booking.getMealIds().stream()
                            .map(mealMap::get).filter(Objects::nonNull).collect(Collectors.toList())
                    : Collections.emptyList();

            return BookingMapper.toResponse(
                    booking,
                    paymentMap.get(booking.getId()),
                    fareMap.get(booking.getFareId()),
                    flightMap.get(booking.getFlightId()),
                    flightInstanceMap.get(booking.getFlightInstanceId()),
                    ancillaries,
                    meals,
                    seats
            );
        }).collect(Collectors.toList());
    }
}
